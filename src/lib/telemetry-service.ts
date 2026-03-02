/**
 * Telemetry Service
 * Queries LLM usage, agent execution, provider health, and build analytics
 * from Supabase for the Telemetry dashboard.
 */

import { supabase } from '@/integrations/supabase/client';

// --- Types ---

export interface ProviderHealthStatus {
  provider: string;
  status: 'healthy' | 'degraded' | 'down';
  successRate: number;
  avgLatencyMs: number;
  consecutiveFailures: number;
  lastSuccessAt: string | null;
  checkedAt: string;
}

export interface LLMUsageSummary {
  totalCalls: number;
  totalTokensInput: number;
  totalTokensOutput: number;
  totalCost: number;
  avgLatencyMs: number;
  cacheHitRate: number;
  byProvider: Array<{
    provider: string;
    model: string;
    calls: number;
    cost: number;
    avgLatencyMs: number;
  }>;
  byAgent: Array<{
    agentRole: string;
    calls: number;
    cost: number;
    avgLatencyMs: number;
    avgTokens: number;
  }>;
}

export interface AgentPerformanceSummary {
  agentRole: string;
  executionCount: number;
  successRate: number;
  avgLatencyMs: number;
  avgQualityScore: number;
  avgCost: number;
  isRegressed: boolean;
  regressionSeverity: string | null;
  baselineSuccessRate: number | null;
}

export interface BuildPipelineStats {
  totalBuilds: number;
  successfulBuilds: number;
  failedBuilds: number;
  activeBuilds: number;
  successRate: number;
  avgDurationSeconds: number;
  totalLLMCost: number;
  avgCostPerBuild: number;
  uniqueUsers: number;
}

export interface BuildStepPerformance {
  agent: string;
  totalRuns: number;
  successes: number;
  failures: number;
  avgDurationSeconds: number;
  avgTokens: number;
  totalCost: number;
  avgCostPerRun: number;
}

export interface FailureHotspot {
  failureStage: string;
  errorMessage: string;
  occurrenceCount: number;
  firstSeen: string;
  lastSeen: string;
}

export interface CostBudget {
  provider: string;
  monthlyBudget: number;
  currentSpend: number;
  alertThreshold: number;
  percentUsed: number;
  isOverThreshold: boolean;
}

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
  label?: string;
}

// --- Service ---

class TelemetryService {
  /**
   * Get provider health statuses
   */
  async getProviderHealth(): Promise<ProviderHealthStatus[]> {
    try {
      const { data, error } = await supabase
        .from('provider_health' as any)
        .select('*')
        .order('provider');

      if (error) throw error;

      return (data || []).map((p: any) => ({
        provider: p.provider,
        status: p.status || 'healthy',
        successRate: Number(p.success_rate) || 0,
        avgLatencyMs: Number(p.avg_latency_ms) || 0,
        consecutiveFailures: Number(p.consecutive_failures) || 0,
        lastSuccessAt: p.last_success_at,
        checkedAt: p.checked_at,
      }));
    } catch (error) {
      console.error('[TelemetryService] Failed to fetch provider health:', error);
      return [];
    }
  }

  /**
   * Get LLM usage summary for a time range
   */
  async getLLMUsageSummary(daysBack: number = 7): Promise<LLMUsageSummary> {
    const since = new Date(Date.now() - daysBack * 86400000).toISOString();

    try {
      const { data, error } = await supabase
        .from('llm_usage_logs' as any)
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const logs = data || [];
      if (logs.length === 0) {
        return {
          totalCalls: 0, totalTokensInput: 0, totalTokensOutput: 0,
          totalCost: 0, avgLatencyMs: 0, cacheHitRate: 0,
          byProvider: [], byAgent: [],
        };
      }

      const totalCalls = logs.length;
      const totalTokensInput = logs.reduce((s: number, l: any) => s + (l.tokens_input || 0), 0);
      const totalTokensOutput = logs.reduce((s: number, l: any) => s + (l.tokens_output || 0), 0);
      const totalCost = logs.reduce((s: number, l: any) => s + Number(l.estimated_cost || 0), 0);
      const avgLatencyMs = Math.round(logs.reduce((s: number, l: any) => s + (l.latency_ms || 0), 0) / totalCalls);
      const cacheHits = logs.filter((l: any) => l.cache_hit).length;
      const cacheHitRate = totalCalls > 0 ? cacheHits / totalCalls : 0;

      // Group by provider+model
      const providerMap = new Map<string, { calls: number; cost: number; latency: number; model: string; provider: string }>();
      for (const l of logs) {
        const key = `${l.provider}:${l.model}`;
        const existing = providerMap.get(key) || { calls: 0, cost: 0, latency: 0, model: l.model, provider: l.provider };
        existing.calls++;
        existing.cost += Number(l.estimated_cost || 0);
        existing.latency += l.latency_ms || 0;
        providerMap.set(key, existing);
      }
      const byProvider = Array.from(providerMap.values()).map(p => ({
        provider: p.provider,
        model: p.model,
        calls: p.calls,
        cost: p.cost,
        avgLatencyMs: Math.round(p.latency / p.calls),
      })).sort((a, b) => b.calls - a.calls);

      // Group by agent
      const agentMap = new Map<string, { calls: number; cost: number; latency: number; tokens: number }>();
      for (const l of logs) {
        const role = l.agent_role || 'unknown';
        const existing = agentMap.get(role) || { calls: 0, cost: 0, latency: 0, tokens: 0 };
        existing.calls++;
        existing.cost += Number(l.estimated_cost || 0);
        existing.latency += l.latency_ms || 0;
        existing.tokens += (l.tokens_input || 0) + (l.tokens_output || 0);
        agentMap.set(role, existing);
      }
      const byAgent = Array.from(agentMap.entries()).map(([role, a]) => ({
        agentRole: role,
        calls: a.calls,
        cost: a.cost,
        avgLatencyMs: Math.round(a.latency / a.calls),
        avgTokens: Math.round(a.tokens / a.calls),
      })).sort((a, b) => b.calls - a.calls);

      return { totalCalls, totalTokensInput, totalTokensOutput, totalCost, avgLatencyMs, cacheHitRate, byProvider, byAgent };
    } catch (error) {
      console.error('[TelemetryService] Failed to fetch LLM usage:', error);
      return {
        totalCalls: 0, totalTokensInput: 0, totalTokensOutput: 0,
        totalCost: 0, avgLatencyMs: 0, cacheHitRate: 0,
        byProvider: [], byAgent: [],
      };
    }
  }

  /**
   * Get agent performance summaries with regression info
   */
  async getAgentPerformance(): Promise<AgentPerformanceSummary[]> {
    try {
      // Get execution stats
      const { data: execData, error: execError } = await supabase
        .from('agent_execution_history' as any)
        .select('agent_role, success, execution_time_ms, quality_score, estimated_cost')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (execError) throw execError;

      // Get baselines
      const { data: baselineData } = await supabase
        .from('agent_performance_baselines' as any)
        .select('*');

      const baselines = new Map<string, any>();
      for (const b of baselineData || []) {
        baselines.set(b.agent_role, b);
      }

      // Aggregate by agent
      const agentMap = new Map<string, { total: number; success: number; latency: number; quality: number; qualityCount: number; cost: number }>();
      for (const e of execData || []) {
        const role = e.agent_role;
        const existing = agentMap.get(role) || { total: 0, success: 0, latency: 0, quality: 0, qualityCount: 0, cost: 0 };
        existing.total++;
        if (e.success) existing.success++;
        existing.latency += e.execution_time_ms || 0;
        if (e.quality_score != null) {
          existing.quality += Number(e.quality_score);
          existing.qualityCount++;
        }
        existing.cost += Number(e.estimated_cost || 0);
        agentMap.set(role, existing);
      }

      return Array.from(agentMap.entries()).map(([role, stats]) => {
        const baseline = baselines.get(role);
        return {
          agentRole: role,
          executionCount: stats.total,
          successRate: stats.total > 0 ? stats.success / stats.total : 0,
          avgLatencyMs: stats.total > 0 ? Math.round(stats.latency / stats.total) : 0,
          avgQualityScore: stats.qualityCount > 0 ? stats.quality / stats.qualityCount : 0,
          avgCost: stats.total > 0 ? stats.cost / stats.total : 0,
          isRegressed: baseline?.is_regressed || false,
          regressionSeverity: baseline?.regression_severity || null,
          baselineSuccessRate: baseline ? Number(baseline.baseline_success_rate) : null,
        };
      }).sort((a, b) => a.agentRole.localeCompare(b.agentRole));
    } catch (error) {
      console.error('[TelemetryService] Failed to fetch agent performance:', error);
      return [];
    }
  }

  /**
   * Get build pipeline statistics using the pre-computed view
   */
  async getBuildPipelineStats(): Promise<BuildPipelineStats> {
    try {
      const { data, error } = await supabase
        .from('builder_stats_global' as any)
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;

      return {
        totalBuilds: Number(data.total_builds) || 0,
        successfulBuilds: Number(data.successful_builds) || 0,
        failedBuilds: Number(data.failed_builds) || 0,
        activeBuilds: Number(data.active_builds) || 0,
        successRate: Number(data.success_rate_pct) || 0,
        avgDurationSeconds: Number(data.avg_duration_seconds) || 0,
        totalLLMCost: Number(data.total_llm_cost) || 0,
        avgCostPerBuild: Number(data.avg_llm_cost_per_build) || 0,
        uniqueUsers: Number(data.unique_users) || 0,
      };
    } catch (error) {
      console.error('[TelemetryService] Failed to fetch build stats:', error);
      return {
        totalBuilds: 0, successfulBuilds: 0, failedBuilds: 0,
        activeBuilds: 0, successRate: 0, avgDurationSeconds: 0,
        totalLLMCost: 0, avgCostPerBuild: 0, uniqueUsers: 0,
      };
    }
  }

  /**
   * Get per-step build performance
   */
  async getBuildStepPerformance(): Promise<BuildStepPerformance[]> {
    try {
      const { data, error } = await supabase
        .from('builder_step_performance' as any)
        .select('*');

      if (error) throw error;

      return (data || []).map((d: any) => ({
        agent: d.agent,
        totalRuns: Number(d.total_runs) || 0,
        successes: Number(d.successes) || 0,
        failures: Number(d.failures) || 0,
        avgDurationSeconds: Number(d.avg_duration_seconds) || 0,
        avgTokens: Number(d.avg_tokens) || 0,
        totalCost: Number(d.total_cost) || 0,
        avgCostPerRun: Number(d.avg_cost_per_run) || 0,
      }));
    } catch (error) {
      console.error('[TelemetryService] Failed to fetch build step performance:', error);
      return [];
    }
  }

  /**
   * Get failure hotspots
   */
  async getFailureHotspots(): Promise<FailureHotspot[]> {
    try {
      const { data, error } = await supabase
        .from('builder_failure_analysis' as any)
        .select('*')
        .order('occurrence_count', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map((d: any) => ({
        failureStage: d.failure_stage,
        errorMessage: d.error_message,
        occurrenceCount: Number(d.occurrence_count) || 0,
        firstSeen: d.first_seen,
        lastSeen: d.last_seen,
      }));
    } catch (error) {
      console.error('[TelemetryService] Failed to fetch failure hotspots:', error);
      return [];
    }
  }

  /**
   * Get cost/budget status per provider
   */
  async getCostBudgets(): Promise<CostBudget[]> {
    try {
      const { data, error } = await supabase
        .from('budget_settings' as any)
        .select('*');

      if (error) throw error;

      return (data || []).map((b: any) => {
        const budget = Number(b.monthly_budget) || 0;
        const spend = Number(b.current_spend) || 0;
        const threshold = Number(b.alert_threshold) || 0.8;
        const percentUsed = budget > 0 ? spend / budget : 0;
        return {
          provider: b.provider,
          monthlyBudget: budget,
          currentSpend: spend,
          alertThreshold: threshold,
          percentUsed,
          isOverThreshold: percentUsed >= threshold,
        };
      });
    } catch (error) {
      console.error('[TelemetryService] Failed to fetch cost budgets:', error);
      return [];
    }
  }

  /**
   * Get LLM cost over time (daily aggregation)
   */
  async getCostTimeSeries(daysBack: number = 30): Promise<TimeSeriesPoint[]> {
    const since = new Date(Date.now() - daysBack * 86400000).toISOString();

    try {
      const { data, error } = await supabase
        .from('llm_usage_logs' as any)
        .select('estimated_cost, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Aggregate by day
      const dailyMap = new Map<string, number>();
      for (const log of data || []) {
        const day = log.created_at.slice(0, 10); // YYYY-MM-DD
        dailyMap.set(day, (dailyMap.get(day) || 0) + Number(log.estimated_cost || 0));
      }

      return Array.from(dailyMap.entries()).map(([day, cost]) => ({
        timestamp: day,
        value: cost,
      }));
    } catch (error) {
      console.error('[TelemetryService] Failed to fetch cost time series:', error);
      return [];
    }
  }

  /**
   * Get LLM call volume over time (daily)
   */
  async getCallVolumeTimeSeries(daysBack: number = 30): Promise<TimeSeriesPoint[]> {
    const since = new Date(Date.now() - daysBack * 86400000).toISOString();

    try {
      const { data, error } = await supabase
        .from('llm_usage_logs' as any)
        .select('created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const dailyMap = new Map<string, number>();
      for (const log of data || []) {
        const day = log.created_at.slice(0, 10);
        dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
      }

      return Array.from(dailyMap.entries()).map(([day, count]) => ({
        timestamp: day,
        value: count,
      }));
    } catch (error) {
      console.error('[TelemetryService] Failed to fetch call volume:', error);
      return [];
    }
  }

  /**
   * Get meta-learner system health state
   */
  async getMetaLearnerState(): Promise<{
    overallHealth: number;
    totalImprovements: number;
    totalCostSaved: number;
    analysisCount: number;
    priorityAgents: string[];
    activeExperiments: string[];
    lastAnalysisAt: string | null;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('meta_learner_state' as any)
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;

      return {
        overallHealth: Number(data.overall_system_health) || 0,
        totalImprovements: Number(data.total_improvements_made) || 0,
        totalCostSaved: Number(data.total_cost_saved) || 0,
        analysisCount: Number(data.analysis_count) || 0,
        priorityAgents: data.priority_agents || [],
        activeExperiments: data.active_experiments || [],
        lastAnalysisAt: data.last_analysis_at,
      };
    } catch (error) {
      console.error('[TelemetryService] Failed to fetch meta-learner state:', error);
      return null;
    }
  }

  /**
   * Get learning insights ordered by priority
   */
  async getLearningInsights(limit: number = 10): Promise<Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    confidence: number;
    potentialImprovement: number;
    effort: string | null;
    actionTaken: boolean;
    sourceAgent: string | null;
    createdAt: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('learning_insights' as any)
        .select('*')
        .order('priority', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((i: any) => ({
        id: i.id,
        type: i.insight_type,
        title: i.title,
        description: i.description,
        confidence: Number(i.confidence) || 0,
        potentialImprovement: Number(i.potential_improvement) || 0,
        effort: i.effort_estimate,
        actionTaken: i.action_taken || false,
        sourceAgent: i.source_agent,
        createdAt: i.created_at,
      }));
    } catch (error) {
      console.error('[TelemetryService] Failed to fetch learning insights:', error);
      return [];
    }
  }
}

export const telemetryService = new TelemetryService();
