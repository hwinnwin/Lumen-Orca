-- Observability & Analytics views for AI App Builder.
-- These views provide operational insights into build performance,
-- cost tracking, and pipeline health.

-- 1. Build summary stats (per user)
CREATE OR REPLACE VIEW public.builder_stats_by_user AS
SELECT
  user_id,
  count(*) AS total_builds,
  count(*) FILTER (WHERE status = 'live') AS successful_builds,
  count(*) FILTER (WHERE status = 'failed') AS failed_builds,
  CASE
    WHEN count(*) > 0
    THEN round(count(*) FILTER (WHERE status = 'live')::numeric / count(*)::numeric * 100, 1)
    ELSE 0
  END AS success_rate_pct,
  round(avg(EXTRACT(EPOCH FROM (completed_at - created_at))) FILTER (WHERE completed_at IS NOT NULL), 1) AS avg_duration_seconds,
  round(sum(llm_cost)::numeric, 4) AS total_llm_cost,
  round(avg(llm_cost)::numeric, 4) AS avg_llm_cost_per_build,
  max(created_at) AS last_build_at
FROM public.builds
GROUP BY user_id;

-- 2. Global build stats (admin dashboard)
CREATE OR REPLACE VIEW public.builder_stats_global AS
SELECT
  count(*) AS total_builds,
  count(*) FILTER (WHERE status = 'live') AS successful_builds,
  count(*) FILTER (WHERE status = 'failed') AS failed_builds,
  count(*) FILTER (WHERE status IN ('pending', 'specifying', 'generating', 'deploying')) AS active_builds,
  CASE
    WHEN count(*) > 0
    THEN round(count(*) FILTER (WHERE status = 'live')::numeric / count(*)::numeric * 100, 1)
    ELSE 0
  END AS success_rate_pct,
  round(avg(EXTRACT(EPOCH FROM (completed_at - created_at))) FILTER (WHERE completed_at IS NOT NULL), 1) AS avg_duration_seconds,
  round(sum(llm_cost)::numeric, 4) AS total_llm_cost,
  round(avg(llm_cost)::numeric, 4) AS avg_llm_cost_per_build,
  count(DISTINCT user_id) AS unique_users
FROM public.builds;

-- 3. Build step performance (which agents are slowest/most expensive)
CREATE OR REPLACE VIEW public.builder_step_performance AS
SELECT
  agent,
  count(*) AS total_runs,
  count(*) FILTER (WHERE status = 'completed') AS successes,
  count(*) FILTER (WHERE status = 'failed') AS failures,
  round(avg(EXTRACT(EPOCH FROM (completed_at - started_at))) FILTER (WHERE completed_at IS NOT NULL), 1) AS avg_duration_seconds,
  round(avg(tokens_used) FILTER (WHERE tokens_used > 0), 0) AS avg_tokens,
  round(sum(cost)::numeric, 6) AS total_cost,
  round(avg(cost)::numeric, 6) AS avg_cost_per_run
FROM public.build_steps
GROUP BY agent;

-- 4. Recent builds (last 24h) for monitoring dashboard
CREATE OR REPLACE VIEW public.builder_recent_builds AS
SELECT
  b.id,
  b.user_id,
  b.prompt,
  b.status,
  b.llm_cost,
  b.created_at,
  b.completed_at,
  EXTRACT(EPOCH FROM (b.completed_at - b.created_at)) AS duration_seconds,
  (SELECT count(*) FROM public.build_steps bs WHERE bs.build_id = b.id) AS step_count,
  (SELECT count(*) FROM public.build_steps bs WHERE bs.build_id = b.id AND bs.status = 'failed') AS failed_steps
FROM public.builds b
WHERE b.created_at > now() - interval '24 hours'
ORDER BY b.created_at DESC;

-- 5. Failure analysis — group errors by stage and message
CREATE OR REPLACE VIEW public.builder_failure_analysis AS
SELECT
  error->>'stage' AS failure_stage,
  error->>'message' AS error_message,
  count(*) AS occurrence_count,
  min(created_at) AS first_seen,
  max(created_at) AS last_seen
FROM public.builds
WHERE status = 'failed' AND error IS NOT NULL
GROUP BY error->>'stage', error->>'message'
ORDER BY occurrence_count DESC;

-- RLS for views: views inherit the RLS policies of the underlying tables.
-- builder_stats_by_user: filtered by user_id through builds RLS
-- builder_stats_global: only service_role can see all (users see only their rows)
-- builder_step_performance: aggregated, inherits from build_steps RLS
-- builder_recent_builds: inherits from builds RLS
-- builder_failure_analysis: inherits from builds RLS
