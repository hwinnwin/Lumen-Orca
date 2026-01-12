/**
 * A11: Meta-Learner
 * Role: Self-improvement engine - analyzes agent performance, identifies patterns,
 *       generates optimizations, and continuously improves the system
 *
 * Capabilities:
 * - Analyze execution history for patterns and anomalies
 * - Detect performance regressions across agents
 * - Generate and validate optimization hypotheses
 * - Conduct A/B testing of prompts and parameters
 * - Learn from human feedback
 * - Self-evolve prompt strategies
 *
 * Target: Enable Lumen-Orca to continuously improve toward F_total ≤ 10⁻⁶
 */

import type {
  AgentRole,
  LearningInsight,
  FailurePattern,
  AgentPerformanceSnapshot,
  MetaLearnerState,
} from './types';

// Configuration for meta-learning behavior
interface MetaLearnerConfig {
  minSamplesForDecision: number;
  learningRate: number;
  explorationRate: number; // For A/B testing
  analysisIntervalMs: number;
  regressionThreshold: number; // 5% drop = regression
  confidenceThreshold: number; // Min confidence to act on insights
}

const DEFAULT_CONFIG: MetaLearnerConfig = {
  minSamplesForDecision: 30,
  learningRate: 0.1,
  explorationRate: 0.2,
  analysisIntervalMs: 300000, // 5 minutes
  regressionThreshold: 0.05,
  confidenceThreshold: 0.75,
};

// Execution record for analysis
interface ExecutionRecord {
  id: string;
  agentRole: string;
  taskId: string;
  model: string;
  provider: string;
  success: boolean;
  executionTimeMs: number;
  qualityScore: number | null;
  errorType: string | null;
  createdAt: string;
}

// Analysis result types
interface AnalysisResult {
  insights: LearningInsight[];
  patterns: FailurePattern[];
  recommendations: OptimizationRecommendation[];
  performanceSnapshots: AgentPerformanceSnapshot[];
}

interface OptimizationRecommendation {
  id: string;
  type: 'prompt_change' | 'parameter_change' | 'model_switch' | 'workflow_change';
  targetAgent: string;
  description: string;
  expectedImprovement: number;
  confidence: number;
  implementation: Record<string, unknown>;
}

export class MetaLearner {
  private config: MetaLearnerConfig;
  private state: MetaLearnerState;
  private supabase: any; // Will be injected
  private isAnalyzing: boolean = false;

  constructor(config: Partial<MetaLearnerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      lastAnalysisAt: null,
      lastOptimizationAt: null,
      analysisCount: 0,
      priorityAgents: [],
      activeExperiments: [],
      overallSystemHealth: 1.0,
      totalImprovementsMade: 0,
      totalCostSaved: 0,
    };
  }

  /**
   * Initialize with Supabase client
   */
  async initialize(supabaseClient: any): Promise<void> {
    this.supabase = supabaseClient;

    // Load existing state from database
    const { data: stateData } = await this.supabase
      .from('meta_learner_state')
      .select('*')
      .single();

    if (stateData) {
      this.state = {
        lastAnalysisAt: stateData.last_analysis_at,
        lastOptimizationAt: stateData.last_optimization_at,
        analysisCount: stateData.analysis_count,
        priorityAgents: stateData.priority_agents || [],
        activeExperiments: stateData.active_experiments || [],
        overallSystemHealth: stateData.overall_system_health,
        totalImprovementsMade: stateData.total_improvements_made,
        totalCostSaved: stateData.total_cost_saved,
      };
    }

    console.log('[A11_MetaLearner] Initialized with state:', this.state);
  }

  /**
   * Run a complete analysis cycle
   * This is the main entry point for self-improvement
   */
  async runAnalysisCycle(): Promise<AnalysisResult> {
    if (this.isAnalyzing) {
      console.log('[A11_MetaLearner] Analysis already in progress, skipping');
      return { insights: [], patterns: [], recommendations: [], performanceSnapshots: [] };
    }

    this.isAnalyzing = true;
    console.log('[A11_MetaLearner] Starting analysis cycle...');

    try {
      // 1. Gather execution history
      const executionHistory = await this.getRecentExecutions(1000);
      console.log(`[A11_MetaLearner] Analyzing ${executionHistory.length} executions`);

      // 2. Calculate performance snapshots for each agent
      const performanceSnapshots = await this.calculatePerformanceSnapshots(executionHistory);

      // 3. Detect failure patterns
      const patterns = await this.detectFailurePatterns(executionHistory);

      // 4. Generate insights from patterns
      const insights = await this.generateInsights(executionHistory, patterns, performanceSnapshots);

      // 5. Create optimization recommendations
      const recommendations = await this.generateRecommendations(insights, performanceSnapshots);

      // 6. Check for regressions
      await this.checkForRegressions(performanceSnapshots);

      // 7. Update system health score
      this.state.overallSystemHealth = this.calculateSystemHealth(performanceSnapshots);

      // 8. Persist state and insights
      await this.persistState();
      await this.persistInsights(insights);

      this.state.analysisCount++;
      this.state.lastAnalysisAt = new Date().toISOString();

      console.log(`[A11_MetaLearner] Analysis complete: ${insights.length} insights, ${patterns.length} patterns, ${recommendations.length} recommendations`);

      return { insights, patterns, recommendations, performanceSnapshots };
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Get recent execution history from database
   */
  private async getRecentExecutions(limit: number): Promise<ExecutionRecord[]> {
    const { data, error } = await this.supabase
      .from('agent_execution_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[A11_MetaLearner] Failed to fetch executions:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      agentRole: row.agent_role,
      taskId: row.task_id,
      model: row.model,
      provider: row.provider,
      success: row.success,
      executionTimeMs: row.execution_time_ms,
      qualityScore: row.quality_score,
      errorType: row.error_type,
      createdAt: row.created_at,
    }));
  }

  /**
   * Calculate performance snapshots for each agent
   */
  private async calculatePerformanceSnapshots(
    executions: ExecutionRecord[]
  ): Promise<AgentPerformanceSnapshot[]> {
    // Group by agent
    const byAgent = new Map<string, ExecutionRecord[]>();
    for (const exec of executions) {
      const existing = byAgent.get(exec.agentRole) || [];
      existing.push(exec);
      byAgent.set(exec.agentRole, existing);
    }

    const snapshots: AgentPerformanceSnapshot[] = [];

    for (const [agentRole, agentExecs] of byAgent) {
      const successCount = agentExecs.filter(e => e.success).length;
      const successRate = agentExecs.length > 0 ? successCount / agentExecs.length : 0;

      const latencies = agentExecs.map(e => e.executionTimeMs).filter(l => l > 0);
      const avgLatencyMs = latencies.length > 0
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
        : 0;

      const qualities = agentExecs.map(e => e.qualityScore).filter((q): q is number => q !== null);
      const avgQuality = qualities.length > 0
        ? qualities.reduce((a, b) => a + b, 0) / qualities.length
        : 0;

      // Calculate trend (compare first half vs second half)
      const midpoint = Math.floor(agentExecs.length / 2);
      const firstHalf = agentExecs.slice(midpoint); // Older
      const secondHalf = agentExecs.slice(0, midpoint); // Newer

      const firstHalfSuccessRate = firstHalf.length > 0
        ? firstHalf.filter(e => e.success).length / firstHalf.length
        : 0;
      const secondHalfSuccessRate = secondHalf.length > 0
        ? secondHalf.filter(e => e.success).length / secondHalf.length
        : 0;

      let trendDirection: 'improving' | 'stable' | 'declining' = 'stable';
      const diff = secondHalfSuccessRate - firstHalfSuccessRate;
      if (diff > 0.05) trendDirection = 'improving';
      else if (diff < -0.05) trendDirection = 'declining';

      snapshots.push({
        agentRole,
        successRate,
        avgLatencyMs,
        avgQuality,
        avgCost: 0, // TODO: Calculate from execution history
        executionCount: agentExecs.length,
        isRegressed: trendDirection === 'declining' && successRate < 0.9,
        trendDirection,
      });
    }

    return snapshots;
  }

  /**
   * Detect patterns in failures
   */
  private async detectFailurePatterns(executions: ExecutionRecord[]): Promise<FailurePattern[]> {
    const failures = executions.filter(e => !e.success);
    const patterns: FailurePattern[] = [];

    // Group failures by error type and agent
    const byErrorAndAgent = new Map<string, ExecutionRecord[]>();
    for (const failure of failures) {
      const key = `${failure.agentRole}:${failure.errorType || 'unknown'}`;
      const existing = byErrorAndAgent.get(key) || [];
      existing.push(failure);
      byErrorAndAgent.set(key, existing);
    }

    for (const [key, failureGroup] of byErrorAndAgent) {
      if (failureGroup.length >= 3) { // Minimum occurrences to be a pattern
        const [agentRole, errorType] = key.split(':');

        // Categorize the failure
        let failureCategory = 'unknown';
        if (errorType === 'timeout') failureCategory = 'infrastructure_related';
        else if (errorType === 'invalid_output') failureCategory = 'prompt_related';
        else if (errorType === 'provider_error') failureCategory = 'infrastructure_related';
        else if (errorType === 'resource_limit') failureCategory = 'complexity_related';

        // Generate root cause hypothesis
        let rootCause = `Agent ${agentRole} experiencing repeated ${errorType} failures`;
        let recommendedAction = 'Investigate and address root cause';

        if (failureCategory === 'prompt_related') {
          rootCause = `Prompt for ${agentRole} may be producing unparseable outputs`;
          recommendedAction = 'Review and refine agent system prompt for clearer output format';
        } else if (failureCategory === 'infrastructure_related') {
          rootCause = `${agentRole} experiencing ${errorType} - likely provider or resource issues`;
          recommendedAction = 'Consider provider fallback or increased timeouts';
        }

        patterns.push({
          patternSignature: key,
          failureType: errorType || 'unknown',
          failureCategory,
          occurrenceCount: failureGroup.length,
          affectedAgents: [agentRole],
          rootCause,
          recommendedAction,
        });
      }
    }

    // Persist patterns to failure_analysis table
    for (const pattern of patterns) {
      await this.supabase.from('failure_analysis').insert({
        agent_role: pattern.affectedAgents[0],
        failure_type: pattern.failureType,
        failure_category: pattern.failureCategory,
        pattern_signature: pattern.patternSignature,
        similar_failure_count: pattern.occurrenceCount,
        root_cause: pattern.rootCause,
        recommended_action: pattern.recommendedAction,
        severity: pattern.occurrenceCount > 10 ? 'high' : pattern.occurrenceCount > 5 ? 'medium' : 'low',
      });
    }

    return patterns;
  }

  /**
   * Generate insights from analysis
   */
  private async generateInsights(
    executions: ExecutionRecord[],
    patterns: FailurePattern[],
    snapshots: AgentPerformanceSnapshot[]
  ): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    // Insight 1: High-performing agents (model as success patterns)
    const topPerformers = snapshots
      .filter(s => s.successRate >= 0.95 && s.executionCount >= 10)
      .sort((a, b) => b.successRate - a.successRate);

    if (topPerformers.length > 0) {
      insights.push({
        id: `insight-${Date.now()}-top-performers`,
        insightType: 'pattern',
        sourceAgent: 'A11_meta_learner',
        targetAgents: topPerformers.map(p => p.agentRole),
        title: 'High-Performing Agents Identified',
        description: `${topPerformers.length} agents achieving >95% success rate. Their configurations can serve as templates.`,
        evidence: { topPerformers },
        confidence: 0.9,
        potentialImprovement: 0,
        priority: 30,
      });
    }

    // Insight 2: Underperforming agents (need attention)
    const underperformers = snapshots
      .filter(s => s.successRate < 0.8 && s.executionCount >= 10)
      .sort((a, b) => a.successRate - b.successRate);

    if (underperformers.length > 0) {
      insights.push({
        id: `insight-${Date.now()}-underperformers`,
        insightType: 'anomaly',
        sourceAgent: 'A11_meta_learner',
        targetAgents: underperformers.map(p => p.agentRole),
        title: 'Underperforming Agents Detected',
        description: `${underperformers.length} agents below 80% success rate. Priority optimization targets.`,
        evidence: { underperformers },
        confidence: 0.95,
        potentialImprovement: (0.95 - underperformers[0].successRate) * 100,
        priority: 90,
      });

      // Add to priority list
      this.state.priorityAgents = underperformers.map(p => p.agentRole);
    }

    // Insight 3: Recurring failure patterns
    const significantPatterns = patterns.filter(p => p.occurrenceCount >= 5);
    if (significantPatterns.length > 0) {
      insights.push({
        id: `insight-${Date.now()}-failure-patterns`,
        insightType: 'pattern',
        sourceAgent: 'A11_meta_learner',
        targetAgents: [...new Set(significantPatterns.flatMap(p => p.affectedAgents))],
        title: 'Recurring Failure Patterns Found',
        description: `${significantPatterns.length} failure patterns detected. Root cause analysis completed.`,
        evidence: { patterns: significantPatterns },
        confidence: 0.85,
        potentialImprovement: 15,
        priority: 80,
      });
    }

    // Insight 4: Model/provider performance comparison
    const byModel = new Map<string, { success: number; total: number }>();
    for (const exec of executions) {
      const key = `${exec.provider}:${exec.model}`;
      const existing = byModel.get(key) || { success: 0, total: 0 };
      existing.total++;
      if (exec.success) existing.success++;
      byModel.set(key, existing);
    }

    const modelPerformance = Array.from(byModel.entries())
      .filter(([_, stats]) => stats.total >= 20)
      .map(([key, stats]) => ({
        model: key,
        successRate: stats.success / stats.total,
        samples: stats.total,
      }))
      .sort((a, b) => b.successRate - a.successRate);

    if (modelPerformance.length > 1) {
      const best = modelPerformance[0];
      const worst = modelPerformance[modelPerformance.length - 1];

      if (best.successRate - worst.successRate > 0.1) {
        insights.push({
          id: `insight-${Date.now()}-model-comparison`,
          insightType: 'optimization',
          sourceAgent: 'A11_meta_learner',
          targetAgents: [], // Applies to all
          title: 'Model Performance Variance Detected',
          description: `${best.model} outperforming ${worst.model} by ${((best.successRate - worst.successRate) * 100).toFixed(1)}%. Consider routing optimization.`,
          evidence: { modelPerformance },
          confidence: 0.8,
          potentialImprovement: (best.successRate - worst.successRate) * 100,
          priority: 70,
        });
      }
    }

    // Insight 5: Latency trends
    const slowAgents = snapshots
      .filter(s => s.avgLatencyMs > 10000 && s.executionCount >= 10)
      .sort((a, b) => b.avgLatencyMs - a.avgLatencyMs);

    if (slowAgents.length > 0) {
      insights.push({
        id: `insight-${Date.now()}-slow-agents`,
        insightType: 'recommendation',
        sourceAgent: 'A11_meta_learner',
        targetAgents: slowAgents.map(a => a.agentRole),
        title: 'High Latency Agents Identified',
        description: `${slowAgents.length} agents averaging >10s response time. Consider faster models or prompt optimization.`,
        evidence: { slowAgents },
        confidence: 0.9,
        potentialImprovement: 0,
        priority: 50,
      });
    }

    return insights;
  }

  /**
   * Generate actionable optimization recommendations
   */
  private async generateRecommendations(
    insights: LearningInsight[],
    snapshots: AgentPerformanceSnapshot[]
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    for (const insight of insights) {
      if (insight.insightType === 'anomaly' && insight.confidence >= this.config.confidenceThreshold) {
        // Recommendation for underperforming agents
        for (const targetAgent of insight.targetAgents) {
          const snapshot = snapshots.find(s => s.agentRole === targetAgent);
          if (!snapshot) continue;

          // Recommend parameter tuning
          recommendations.push({
            id: `rec-${Date.now()}-${targetAgent}-params`,
            type: 'parameter_change',
            targetAgent,
            description: `Adjust ${targetAgent} parameters to improve success rate from ${(snapshot.successRate * 100).toFixed(1)}%`,
            expectedImprovement: (0.95 - snapshot.successRate) * 100,
            confidence: insight.confidence,
            implementation: {
              action: 'reduce_temperature',
              currentTemperature: 0.7,
              recommendedTemperature: 0.5,
              rationale: 'Lower temperature for more consistent outputs',
            },
          });

          // Recommend prompt review
          recommendations.push({
            id: `rec-${Date.now()}-${targetAgent}-prompt`,
            type: 'prompt_change',
            targetAgent,
            description: `Review and refine ${targetAgent} system prompt for clearer instructions`,
            expectedImprovement: 10,
            confidence: 0.7,
            implementation: {
              action: 'refine_prompt',
              suggestions: [
                'Add explicit output format examples',
                'Include error handling instructions',
                'Clarify edge case behavior',
              ],
            },
          });
        }
      }

      if (insight.insightType === 'optimization' && insight.title.includes('Model Performance')) {
        // Model switching recommendation
        const evidence = insight.evidence as { modelPerformance: { model: string; successRate: number }[] };
        const bestModel = evidence.modelPerformance[0];

        for (const targetAgent of this.state.priorityAgents) {
          recommendations.push({
            id: `rec-${Date.now()}-${targetAgent}-model`,
            type: 'model_switch',
            targetAgent,
            description: `Consider switching ${targetAgent} to ${bestModel.model} for improved reliability`,
            expectedImprovement: insight.potentialImprovement,
            confidence: insight.confidence,
            implementation: {
              action: 'switch_model',
              targetModel: bestModel.model,
              currentSuccessRate: snapshots.find(s => s.agentRole === targetAgent)?.successRate || 0,
              targetSuccessRate: bestModel.successRate,
            },
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Check for performance regressions
   */
  private async checkForRegressions(snapshots: AgentPerformanceSnapshot[]): Promise<void> {
    for (const snapshot of snapshots) {
      if (snapshot.isRegressed) {
        console.warn(`[A11_MetaLearner] REGRESSION DETECTED: ${snapshot.agentRole} (${(snapshot.successRate * 100).toFixed(1)}% success, trend: ${snapshot.trendDirection})`);

        // Update baseline table
        await this.supabase
          .from('agent_performance_baselines')
          .upsert({
            agent_role: snapshot.agentRole,
            current_success_rate: snapshot.successRate,
            current_avg_latency_ms: snapshot.avgLatencyMs,
            current_avg_quality: snapshot.avgQuality,
            is_regressed: true,
            regression_detected_at: new Date().toISOString(),
            regression_severity: snapshot.successRate < 0.7 ? 'critical' : snapshot.successRate < 0.85 ? 'major' : 'minor',
            last_updated: new Date().toISOString(),
          }, {
            onConflict: 'agent_role',
          });
      }
    }
  }

  /**
   * Calculate overall system health score
   */
  private calculateSystemHealth(snapshots: AgentPerformanceSnapshot[]): number {
    if (snapshots.length === 0) return 1.0;

    const avgSuccessRate = snapshots.reduce((sum, s) => sum + s.successRate, 0) / snapshots.length;
    const regressedCount = snapshots.filter(s => s.isRegressed).length;
    const regressionPenalty = regressedCount * 0.05;

    return Math.max(0, Math.min(1, avgSuccessRate - regressionPenalty));
  }

  /**
   * Persist state to database
   */
  private async persistState(): Promise<void> {
    await this.supabase
      .from('meta_learner_state')
      .update({
        last_analysis_at: this.state.lastAnalysisAt,
        last_optimization_at: this.state.lastOptimizationAt,
        analysis_count: this.state.analysisCount,
        priority_agents: this.state.priorityAgents,
        active_experiments: this.state.activeExperiments,
        overall_system_health: this.state.overallSystemHealth,
        total_improvements_made: this.state.totalImprovementsMade,
        total_cost_saved: this.state.totalCostSaved,
        updated_at: new Date().toISOString(),
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update any row
  }

  /**
   * Persist insights to database
   */
  private async persistInsights(insights: LearningInsight[]): Promise<void> {
    for (const insight of insights) {
      await this.supabase.from('learning_insights').insert({
        insight_type: insight.insightType,
        source_agent: insight.sourceAgent,
        target_agents: insight.targetAgents,
        title: insight.title,
        description: insight.description,
        evidence: insight.evidence,
        confidence: insight.confidence,
        potential_improvement: insight.potentialImprovement,
        priority: insight.priority,
      });
    }
  }

  /**
   * Apply an optimization recommendation
   */
  async applyRecommendation(recommendation: OptimizationRecommendation): Promise<boolean> {
    console.log(`[A11_MetaLearner] Applying recommendation: ${recommendation.description}`);

    try {
      if (recommendation.type === 'parameter_change') {
        const impl = recommendation.implementation as { recommendedTemperature?: number };
        if (impl.recommendedTemperature !== undefined) {
          await this.supabase
            .from('llm_configurations')
            .update({ temperature: impl.recommendedTemperature })
            .eq('agent_role', recommendation.targetAgent);
        }
      }

      if (recommendation.type === 'model_switch') {
        const impl = recommendation.implementation as { targetModel?: string };
        if (impl.targetModel) {
          const [provider, model] = impl.targetModel.split(':');
          await this.supabase
            .from('llm_configurations')
            .update({ provider, model })
            .eq('agent_role', recommendation.targetAgent);
        }
      }

      this.state.totalImprovementsMade++;
      this.state.lastOptimizationAt = new Date().toISOString();
      await this.persistState();

      return true;
    } catch (error) {
      console.error('[A11_MetaLearner] Failed to apply recommendation:', error);
      return false;
    }
  }

  /**
   * Record human feedback for learning
   */
  async recordFeedback(
    executionId: string,
    agentRole: string,
    rating: number,
    feedbackType: string,
    comment?: string,
    expectedOutput?: string
  ): Promise<void> {
    await this.supabase.from('agent_feedback').insert({
      execution_id: executionId,
      agent_role: agentRole,
      rating,
      feedback_type: feedbackType,
      comment,
      expected_output: expectedOutput,
    });

    // Also update execution history with rating
    await this.supabase
      .from('agent_execution_history')
      .update({ user_rating: rating, user_feedback: comment })
      .eq('id', executionId);
  }

  /**
   * Get current state
   */
  getState(): MetaLearnerState {
    return { ...this.state };
  }

  /**
   * Start continuous learning loop
   */
  startContinuousLearning(): () => void {
    console.log('[A11_MetaLearner] Starting continuous learning loop');

    const intervalId = setInterval(async () => {
      try {
        await this.runAnalysisCycle();
      } catch (error) {
        console.error('[A11_MetaLearner] Analysis cycle failed:', error);
      }
    }, this.config.analysisIntervalMs);

    // Return cleanup function
    return () => {
      console.log('[A11_MetaLearner] Stopping continuous learning loop');
      clearInterval(intervalId);
    };
  }
}

// Singleton instance for global access
let metaLearnerInstance: MetaLearner | null = null;

export function getMetaLearner(config?: Partial<MetaLearnerConfig>): MetaLearner {
  if (!metaLearnerInstance) {
    metaLearnerInstance = new MetaLearner(config);
  }
  return metaLearnerInstance;
}

export function resetMetaLearner(): void {
  metaLearnerInstance = null;
}
