-- ============================================================================
-- LUMEN ORCA: Self-Improvement Infrastructure
-- Purpose: Enable autonomous learning, meta-analysis, and continuous improvement
-- Target: F_total ≤ 10⁻⁶ with self-evolving capabilities
-- ============================================================================

-- ============================================================================
-- 1. AGENT EXECUTION HISTORY - Core learning data
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_execution_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_role text NOT NULL,
  task_id text NOT NULL,
  prompt_hash text, -- SHA256 of system prompt for version tracking
  model text NOT NULL,
  provider text NOT NULL,
  temperature decimal(3,2) DEFAULT 0.7,

  -- Execution metrics
  input_tokens integer,
  output_tokens integer,
  execution_time_ms integer,
  estimated_cost decimal(10,6),

  -- Outcome tracking
  success boolean NOT NULL DEFAULT false,
  error_message text,
  error_type text, -- 'timeout', 'invalid_output', 'test_failure', 'resource_limit', 'provider_error'

  -- Quality metrics (when available)
  quality_score decimal(3,2), -- 0.00-1.00 composite score
  code_quality_score decimal(3,2),
  test_coverage decimal(3,2),
  mutation_score decimal(3,2),

  -- Human feedback (optional)
  user_rating integer CHECK (user_rating >= 1 AND user_rating <= 5),
  user_feedback text,

  -- Context
  input_summary text, -- Truncated input for pattern analysis
  output_summary text, -- Truncated output for pattern analysis

  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for efficient learning queries
CREATE INDEX IF NOT EXISTS idx_execution_history_agent ON public.agent_execution_history(agent_role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_execution_history_success ON public.agent_execution_history(success, agent_role);
CREATE INDEX IF NOT EXISTS idx_execution_history_model ON public.agent_execution_history(model, provider);
CREATE INDEX IF NOT EXISTS idx_execution_history_quality ON public.agent_execution_history(quality_score DESC NULLS LAST);

-- ============================================================================
-- 2. PROMPT VARIANTS - A/B testing and optimization
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.prompt_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_role text NOT NULL,
  variant_name text NOT NULL,
  prompt_text text NOT NULL,
  prompt_hash text NOT NULL, -- SHA256 for deduplication
  version integer NOT NULL DEFAULT 1,

  -- Performance tracking
  execution_count integer NOT NULL DEFAULT 0,
  success_count integer NOT NULL DEFAULT 0,
  success_rate decimal(5,4) GENERATED ALWAYS AS (
    CASE WHEN execution_count > 0
    THEN success_count::decimal / execution_count
    ELSE 0 END
  ) STORED,

  avg_quality_score decimal(3,2),
  avg_execution_time_ms integer,
  avg_cost decimal(10,6),

  -- Lifecycle
  is_active boolean NOT NULL DEFAULT false,
  is_champion boolean NOT NULL DEFAULT false, -- Current best performer
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  retired_at timestamptz,

  UNIQUE(agent_role, prompt_hash)
);

CREATE INDEX IF NOT EXISTS idx_prompt_variants_active ON public.prompt_variants(agent_role, is_active);
CREATE INDEX IF NOT EXISTS idx_prompt_variants_champion ON public.prompt_variants(agent_role, is_champion) WHERE is_champion = true;

-- ============================================================================
-- 3. AGENT PARAMETERS - Hyperparameter tuning history
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_parameter_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_role text NOT NULL,

  -- Parameters being tested
  model text NOT NULL,
  provider text NOT NULL,
  temperature decimal(3,2) NOT NULL,
  max_tokens integer NOT NULL,
  top_p decimal(3,2),

  -- Experiment tracking
  experiment_name text,
  experiment_batch text, -- Group related experiments

  -- Results
  execution_count integer NOT NULL DEFAULT 0,
  success_rate decimal(5,4),
  avg_quality_score decimal(3,2),
  avg_latency_ms integer,
  avg_cost decimal(10,6),

  -- Statistical confidence
  confidence_level decimal(3,2), -- 0.00-1.00
  is_statistically_significant boolean DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parameters_agent ON public.agent_parameter_experiments(agent_role);
CREATE INDEX IF NOT EXISTS idx_parameters_batch ON public.agent_parameter_experiments(experiment_batch);

-- ============================================================================
-- 4. FAILURE ANALYSIS - Root cause and pattern detection
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.failure_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid REFERENCES public.agent_execution_history(id) ON DELETE CASCADE,
  agent_role text NOT NULL,

  -- Classification
  failure_type text NOT NULL, -- 'timeout', 'invalid_output', 'test_failure', 'resource_limit', 'provider_error', 'logic_error'
  failure_category text, -- 'prompt_related', 'model_related', 'complexity_related', 'infrastructure_related'
  severity text NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'

  -- Analysis (generated by A11 Meta-Learner)
  root_cause text,
  pattern_signature text, -- Unique signature for pattern matching
  similar_failure_count integer DEFAULT 0,

  -- Recommendations
  recommended_action text,
  recommended_prompt_change text,
  recommended_parameter_change jsonb,

  -- Resolution tracking
  resolution_status text DEFAULT 'pending', -- 'pending', 'in_progress', 'resolved', 'wont_fix'
  resolution_notes text,
  resolved_at timestamptz,
  resolved_by text, -- 'auto', 'human', 'A11_meta_learner'

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_failure_agent ON public.failure_analysis(agent_role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_failure_type ON public.failure_analysis(failure_type, failure_category);
CREATE INDEX IF NOT EXISTS idx_failure_pattern ON public.failure_analysis(pattern_signature);
CREATE INDEX IF NOT EXISTS idx_failure_unresolved ON public.failure_analysis(resolution_status) WHERE resolution_status = 'pending';

-- ============================================================================
-- 5. LEARNING INSIGHTS - Meta-learner discoveries
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.learning_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type text NOT NULL, -- 'pattern', 'optimization', 'anomaly', 'recommendation', 'correlation'
  source_agent text, -- Which agent's data generated this insight
  target_agents text[], -- Which agents this insight applies to

  -- The insight
  title text NOT NULL,
  description text NOT NULL,
  evidence jsonb NOT NULL, -- Supporting data
  confidence decimal(3,2) NOT NULL, -- 0.00-1.00

  -- Impact assessment
  potential_improvement decimal(5,2), -- Estimated % improvement
  effort_estimate text, -- 'low', 'medium', 'high'
  priority integer DEFAULT 50, -- 1-100

  -- Action tracking
  action_taken boolean DEFAULT false,
  action_result text,
  validated boolean DEFAULT false,
  validation_result text,

  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz -- Some insights become stale
);

CREATE INDEX IF NOT EXISTS idx_insights_type ON public.learning_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_insights_priority ON public.learning_insights(priority DESC) WHERE action_taken = false;
CREATE INDEX IF NOT EXISTS idx_insights_target ON public.learning_insights USING GIN(target_agents);

-- ============================================================================
-- 6. AGENT FEEDBACK - Human-in-the-loop learning
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid REFERENCES public.agent_execution_history(id) ON DELETE CASCADE,
  agent_role text NOT NULL,
  task_id text,

  -- Feedback
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_type text NOT NULL, -- 'output_quality', 'prompt_accuracy', 'speed', 'cost', 'overall'
  comment text,

  -- Specific corrections (for learning)
  expected_output text, -- What should have been produced
  correction_applied boolean DEFAULT false,

  -- Context
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_agent ON public.agent_feedback(agent_role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON public.agent_feedback(rating, agent_role);

-- ============================================================================
-- 7. AUDIT LOGS - Complete execution trail (was missing!)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  event_status text NOT NULL, -- 'success', 'failure', 'warning'
  event_details jsonb,

  -- Context
  user_id uuid,
  session_id text,
  ip_address text,
  user_agent text,

  -- Tracing
  trace_id text,
  span_id text,
  parent_span_id text,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_event_type ON public.audit_logs(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trace ON public.audit_logs(trace_id);
CREATE INDEX IF NOT EXISTS idx_audit_session ON public.audit_logs(session_id);

-- ============================================================================
-- 8. PERFORMANCE BASELINES - Regression detection
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_performance_baselines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_role text NOT NULL UNIQUE,

  -- Baseline metrics (rolling 7-day average)
  baseline_success_rate decimal(5,4),
  baseline_avg_latency_ms integer,
  baseline_avg_quality decimal(3,2),
  baseline_avg_cost decimal(10,6),

  -- Thresholds for alerting
  success_rate_threshold decimal(5,4) DEFAULT 0.95,
  latency_threshold_ms integer DEFAULT 5000,
  quality_threshold decimal(3,2) DEFAULT 0.80,

  -- Current status
  current_success_rate decimal(5,4),
  current_avg_latency_ms integer,
  current_avg_quality decimal(3,2),

  -- Regression detection
  is_regressed boolean DEFAULT false,
  regression_detected_at timestamptz,
  regression_severity text, -- 'minor', 'major', 'critical'

  last_updated timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 9. META-LEARNER STATE - A11 operational state
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.meta_learner_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Learning cycle tracking
  last_analysis_at timestamptz,
  last_optimization_at timestamptz,
  analysis_count integer DEFAULT 0,

  -- Current focus
  priority_agents text[], -- Agents currently being optimized
  active_experiments text[], -- Running A/B tests

  -- Global metrics
  overall_system_health decimal(3,2), -- 0.00-1.00
  total_improvements_made integer DEFAULT 0,
  total_cost_saved decimal(12,2) DEFAULT 0,

  -- Configuration
  learning_rate decimal(3,2) DEFAULT 0.1,
  exploration_rate decimal(3,2) DEFAULT 0.2, -- For A/B testing
  min_samples_for_decision integer DEFAULT 30,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure only one meta-learner state row
INSERT INTO public.meta_learner_state (id)
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 10. FUNCTIONS - Self-improvement operations
-- ============================================================================

-- Function: Record agent execution and update metrics
CREATE OR REPLACE FUNCTION public.record_agent_execution(
  p_agent_role text,
  p_task_id text,
  p_model text,
  p_provider text,
  p_success boolean,
  p_execution_time_ms integer,
  p_input_tokens integer DEFAULT NULL,
  p_output_tokens integer DEFAULT NULL,
  p_estimated_cost decimal DEFAULT NULL,
  p_quality_score decimal DEFAULT NULL,
  p_error_message text DEFAULT NULL,
  p_error_type text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_execution_id uuid;
BEGIN
  -- Insert execution record
  INSERT INTO public.agent_execution_history (
    agent_role, task_id, model, provider, success,
    execution_time_ms, input_tokens, output_tokens,
    estimated_cost, quality_score, error_message, error_type
  ) VALUES (
    p_agent_role, p_task_id, p_model, p_provider, p_success,
    p_execution_time_ms, p_input_tokens, p_output_tokens,
    p_estimated_cost, p_quality_score, p_error_message, p_error_type
  )
  RETURNING id INTO v_execution_id;

  -- Update prompt variant stats if applicable
  UPDATE public.prompt_variants
  SET
    execution_count = execution_count + 1,
    success_count = success_count + (CASE WHEN p_success THEN 1 ELSE 0 END),
    avg_quality_score = COALESCE(
      (avg_quality_score * execution_count + COALESCE(p_quality_score, avg_quality_score)) / (execution_count + 1),
      p_quality_score
    ),
    avg_execution_time_ms = COALESCE(
      (avg_execution_time_ms * execution_count + p_execution_time_ms) / (execution_count + 1),
      p_execution_time_ms
    ),
    updated_at = now()
  WHERE agent_role = p_agent_role AND is_active = true;

  RETURN v_execution_id;
END;
$$;

-- Function: Get best performing prompt for agent
CREATE OR REPLACE FUNCTION public.get_champion_prompt(p_agent_role text)
RETURNS TABLE(prompt_text text, success_rate decimal, avg_quality decimal)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT pv.prompt_text, pv.success_rate, pv.avg_quality_score
  FROM public.prompt_variants pv
  WHERE pv.agent_role = p_agent_role
    AND pv.is_champion = true
    AND pv.is_active = true
  LIMIT 1;
END;
$$;

-- Function: Calculate agent success rate (last N executions)
CREATE OR REPLACE FUNCTION public.get_agent_success_rate(
  p_agent_role text,
  p_last_n integer DEFAULT 100
)
RETURNS decimal
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_success_rate decimal;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN success THEN 1 ELSE 0 END)::decimal / NULLIF(COUNT(*), 0), 0)
  INTO v_success_rate
  FROM (
    SELECT success
    FROM public.agent_execution_history
    WHERE agent_role = p_agent_role
    ORDER BY created_at DESC
    LIMIT p_last_n
  ) recent;

  RETURN v_success_rate;
END;
$$;

-- Function: Detect performance regression
CREATE OR REPLACE FUNCTION public.check_agent_regression(p_agent_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_baseline record;
  v_current_rate decimal;
  v_is_regressed boolean := false;
BEGIN
  -- Get baseline
  SELECT * INTO v_baseline
  FROM public.agent_performance_baselines
  WHERE agent_role = p_agent_role;

  IF v_baseline IS NULL THEN
    RETURN false;
  END IF;

  -- Calculate current success rate
  v_current_rate := public.get_agent_success_rate(p_agent_role, 50);

  -- Check for regression (current < baseline - threshold margin)
  IF v_current_rate < (v_baseline.baseline_success_rate - 0.05) THEN
    v_is_regressed := true;

    -- Update baseline record
    UPDATE public.agent_performance_baselines
    SET
      is_regressed = true,
      regression_detected_at = CASE WHEN NOT is_regressed THEN now() ELSE regression_detected_at END,
      current_success_rate = v_current_rate,
      last_updated = now()
    WHERE agent_role = p_agent_role;
  END IF;

  RETURN v_is_regressed;
END;
$$;

-- ============================================================================
-- 11. RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.agent_execution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_parameter_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failure_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_performance_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_learner_state ENABLE ROW LEVEL SECURITY;

-- Service role has full access (for edge functions and background jobs)
CREATE POLICY "Service role full access to execution_history"
ON public.agent_execution_history FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to prompt_variants"
ON public.prompt_variants FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to parameter_experiments"
ON public.agent_parameter_experiments FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to failure_analysis"
ON public.failure_analysis FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to learning_insights"
ON public.learning_insights FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to agent_feedback"
ON public.agent_feedback FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to audit_logs"
ON public.audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to performance_baselines"
ON public.agent_performance_baselines FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to meta_learner_state"
ON public.meta_learner_state FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read most tables
CREATE POLICY "Authenticated users can view execution history"
ON public.agent_execution_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view prompt variants"
ON public.prompt_variants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view insights"
ON public.learning_insights FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can submit feedback"
ON public.agent_feedback FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can view their feedback"
ON public.agent_feedback FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================================
-- 12. COMMENTS
-- ============================================================================
COMMENT ON TABLE public.agent_execution_history IS 'Core learning data: every agent execution with outcomes and metrics';
COMMENT ON TABLE public.prompt_variants IS 'Prompt A/B testing: track which prompts perform best per agent';
COMMENT ON TABLE public.agent_parameter_experiments IS 'Hyperparameter tuning: model, temperature, max_tokens experiments';
COMMENT ON TABLE public.failure_analysis IS 'Root cause analysis: classify failures and track resolutions';
COMMENT ON TABLE public.learning_insights IS 'Meta-learner discoveries: patterns, optimizations, recommendations';
COMMENT ON TABLE public.agent_feedback IS 'Human feedback loop: ratings and corrections for supervised learning';
COMMENT ON TABLE public.audit_logs IS 'Complete audit trail: all system events for debugging and compliance';
COMMENT ON TABLE public.agent_performance_baselines IS 'Regression detection: track baseline performance and alert on degradation';
COMMENT ON TABLE public.meta_learner_state IS 'A11 Meta-Learner operational state and configuration';
