/**
 * Prompt Optimizer Service
 * Manages prompt variants, A/B testing, and automatic optimization
 * for the Lumen-Orca self-improvement system
 */

import { supabase } from '@/integrations/supabase/client';

export interface PromptVariant {
  id: string;
  agentRole: string;
  variantName: string;
  promptText: string;
  promptHash: string;
  version: number;
  executionCount: number;
  successCount: number;
  successRate: number;
  avgQualityScore: number | null;
  avgExecutionTimeMs: number | null;
  avgCost: number | null;
  isActive: boolean;
  isChampion: boolean;
  createdAt: string;
}

export interface ABTestConfig {
  agentRole: string;
  controlVariantId: string;
  treatmentVariantId: string;
  trafficSplit: number; // 0.0-1.0, percentage going to treatment
  minSamples: number;
  confidenceThreshold: number;
  startedAt: string;
  status: 'running' | 'completed' | 'stopped';
}

export interface PromptOptimizationResult {
  agentRole: string;
  championVariantId: string;
  previousChampionId: string | null;
  improvement: number; // Percentage improvement
  confidence: number;
  decision: 'promoted' | 'rejected' | 'inconclusive';
}

class PromptOptimizerService {
  /**
   * Create a new prompt variant for A/B testing
   */
  async createVariant(
    agentRole: string,
    variantName: string,
    promptText: string
  ): Promise<PromptVariant | null> {
    try {
      // Generate hash for deduplication
      const promptHash = await this.hashPrompt(promptText);

      const { data, error } = await supabase
        .from('prompt_variants')
        .insert({
          agent_role: agentRole,
          variant_name: variantName,
          prompt_text: promptText,
          prompt_hash: promptHash,
          version: 1,
          is_active: false,
          is_champion: false,
        })
        .select()
        .single();

      if (error) {
        console.error('[PromptOptimizer] Failed to create variant:', error);
        return null;
      }

      return this.mapVariant(data);
    } catch (error) {
      console.error('[PromptOptimizer] Error creating variant:', error);
      return null;
    }
  }

  /**
   * Get the champion (best performing) prompt for an agent
   */
  async getChampionPrompt(agentRole: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('prompt_variants')
        .select('prompt_text')
        .eq('agent_role', agentRole)
        .eq('is_champion', true)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      return data.prompt_text;
    } catch (error) {
      console.error('[PromptOptimizer] Error getting champion:', error);
      return null;
    }
  }

  /**
   * Select a prompt variant for execution (supports A/B testing)
   */
  async selectVariant(agentRole: string): Promise<{ variantId: string; promptText: string } | null> {
    try {
      // Get active variants for this agent
      const { data: variants, error } = await supabase
        .from('prompt_variants')
        .select('*')
        .eq('agent_role', agentRole)
        .eq('is_active', true)
        .order('is_champion', { ascending: false });

      if (error || !variants || variants.length === 0) {
        return null;
      }

      // If only one active variant (champion), use it
      if (variants.length === 1) {
        return {
          variantId: variants[0].id,
          promptText: variants[0].prompt_text,
        };
      }

      // A/B testing: randomly select between champion and challengers
      const champion = variants.find(v => v.is_champion);
      const challengers = variants.filter(v => !v.is_champion);

      if (!champion || challengers.length === 0) {
        return {
          variantId: variants[0].id,
          promptText: variants[0].prompt_text,
        };
      }

      // 80% champion, 20% challenger (exploration)
      const explorationRate = 0.2;
      if (Math.random() > explorationRate) {
        return {
          variantId: champion.id,
          promptText: champion.prompt_text,
        };
      }

      // Select random challenger
      const challenger = challengers[Math.floor(Math.random() * challengers.length)];
      return {
        variantId: challenger.id,
        promptText: challenger.prompt_text,
      };
    } catch (error) {
      console.error('[PromptOptimizer] Error selecting variant:', error);
      return null;
    }
  }

  /**
   * Record execution result for a variant
   */
  async recordResult(
    variantId: string,
    success: boolean,
    qualityScore?: number,
    executionTimeMs?: number,
    cost?: number
  ): Promise<void> {
    try {
      // Get current stats
      const { data: variant, error: fetchError } = await supabase
        .from('prompt_variants')
        .select('*')
        .eq('id', variantId)
        .single();

      if (fetchError || !variant) {
        console.error('[PromptOptimizer] Variant not found:', variantId);
        return;
      }

      // Calculate new averages
      const newExecutionCount = variant.execution_count + 1;
      const newSuccessCount = variant.success_count + (success ? 1 : 0);

      const newAvgQuality = qualityScore !== undefined
        ? this.updateAverage(variant.avg_quality_score, qualityScore, newExecutionCount)
        : variant.avg_quality_score;

      const newAvgTime = executionTimeMs !== undefined
        ? this.updateAverage(variant.avg_execution_time_ms, executionTimeMs, newExecutionCount)
        : variant.avg_execution_time_ms;

      const newAvgCost = cost !== undefined
        ? this.updateAverage(variant.avg_cost, cost, newExecutionCount)
        : variant.avg_cost;

      // Update variant
      const { error: updateError } = await supabase
        .from('prompt_variants')
        .update({
          execution_count: newExecutionCount,
          success_count: newSuccessCount,
          avg_quality_score: newAvgQuality,
          avg_execution_time_ms: newAvgTime,
          avg_cost: newAvgCost,
          updated_at: new Date().toISOString(),
        })
        .eq('id', variantId);

      if (updateError) {
        console.error('[PromptOptimizer] Failed to update variant:', updateError);
      }
    } catch (error) {
      console.error('[PromptOptimizer] Error recording result:', error);
    }
  }

  /**
   * Evaluate variants and potentially promote a new champion
   */
  async evaluateAndPromote(
    agentRole: string,
    minSamples: number = 30,
    confidenceThreshold: number = 0.95
  ): Promise<PromptOptimizationResult | null> {
    try {
      // Get all variants for this agent
      const { data: variants, error } = await supabase
        .from('prompt_variants')
        .select('*')
        .eq('agent_role', agentRole)
        .eq('is_active', true)
        .gte('execution_count', minSamples)
        .order('success_rate', { ascending: false });

      if (error || !variants || variants.length < 2) {
        return null;
      }

      const currentChampion = variants.find(v => v.is_champion);
      const bestPerformer = variants[0];

      if (!currentChampion) {
        // No champion yet, promote the best performer
        await this.promoteToChampion(bestPerformer.id, agentRole);
        return {
          agentRole,
          championVariantId: bestPerformer.id,
          previousChampionId: null,
          improvement: 0,
          confidence: 1.0,
          decision: 'promoted',
        };
      }

      // Check if best performer beats current champion
      if (bestPerformer.id === currentChampion.id) {
        return {
          agentRole,
          championVariantId: currentChampion.id,
          previousChampionId: null,
          improvement: 0,
          confidence: 1.0,
          decision: 'inconclusive',
        };
      }

      // Calculate statistical significance
      const confidence = this.calculateConfidence(
        currentChampion.success_rate,
        currentChampion.execution_count,
        bestPerformer.success_rate,
        bestPerformer.execution_count
      );

      const improvement = ((bestPerformer.success_rate - currentChampion.success_rate) /
        currentChampion.success_rate) * 100;

      if (confidence >= confidenceThreshold && improvement > 0) {
        // Promote new champion
        await this.promoteToChampion(bestPerformer.id, agentRole);
        return {
          agentRole,
          championVariantId: bestPerformer.id,
          previousChampionId: currentChampion.id,
          improvement,
          confidence,
          decision: 'promoted',
        };
      }

      return {
        agentRole,
        championVariantId: currentChampion.id,
        previousChampionId: null,
        improvement,
        confidence,
        decision: confidence < confidenceThreshold ? 'inconclusive' : 'rejected',
      };
    } catch (error) {
      console.error('[PromptOptimizer] Error evaluating variants:', error);
      return null;
    }
  }

  /**
   * Promote a variant to champion status
   */
  private async promoteToChampion(variantId: string, agentRole: string): Promise<void> {
    // Demote current champion
    await supabase
      .from('prompt_variants')
      .update({ is_champion: false })
      .eq('agent_role', agentRole)
      .eq('is_champion', true);

    // Promote new champion
    await supabase
      .from('prompt_variants')
      .update({ is_champion: true })
      .eq('id', variantId);

    console.log(`[PromptOptimizer] Promoted variant ${variantId} to champion for ${agentRole}`);
  }

  /**
   * Get all variants for an agent
   */
  async getVariants(agentRole: string): Promise<PromptVariant[]> {
    try {
      const { data, error } = await supabase
        .from('prompt_variants')
        .select('*')
        .eq('agent_role', agentRole)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[PromptOptimizer] Failed to fetch variants:', error);
        return [];
      }

      return (data || []).map(this.mapVariant);
    } catch (error) {
      console.error('[PromptOptimizer] Error fetching variants:', error);
      return [];
    }
  }

  /**
   * Activate a variant for A/B testing
   */
  async activateVariant(variantId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('prompt_variants')
        .update({ is_active: true })
        .eq('id', variantId);

      return !error;
    } catch (error) {
      console.error('[PromptOptimizer] Error activating variant:', error);
      return false;
    }
  }

  /**
   * Deactivate a variant
   */
  async deactivateVariant(variantId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('prompt_variants')
        .update({ is_active: false, retired_at: new Date().toISOString() })
        .eq('id', variantId);

      return !error;
    } catch (error) {
      console.error('[PromptOptimizer] Error deactivating variant:', error);
      return false;
    }
  }

  /**
   * Helper: Hash prompt text for deduplication
   */
  private async hashPrompt(promptText: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(promptText);

    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback for environments without crypto.subtle
    let hash = 0;
    for (let i = 0; i < promptText.length; i++) {
      const char = promptText.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Helper: Update running average
   */
  private updateAverage(
    currentAvg: number | null,
    newValue: number,
    newCount: number
  ): number {
    if (currentAvg === null || newCount === 1) {
      return newValue;
    }
    return ((currentAvg * (newCount - 1)) + newValue) / newCount;
  }

  /**
   * Helper: Calculate statistical confidence (simplified z-test)
   */
  private calculateConfidence(
    rate1: number,
    n1: number,
    rate2: number,
    n2: number
  ): number {
    // Pooled probability
    const pooled = (rate1 * n1 + rate2 * n2) / (n1 + n2);

    // Standard error
    const se = Math.sqrt(pooled * (1 - pooled) * (1/n1 + 1/n2));

    if (se === 0) return 1.0;

    // Z-score
    const z = Math.abs(rate2 - rate1) / se;

    // Convert to confidence (simplified)
    // For z >= 1.96, confidence >= 95%
    // For z >= 2.58, confidence >= 99%
    if (z >= 2.58) return 0.99;
    if (z >= 1.96) return 0.95;
    if (z >= 1.645) return 0.90;
    if (z >= 1.28) return 0.80;
    return z / 2.58; // Linear approximation for lower values
  }

  /**
   * Helper: Map database row to PromptVariant
   */
  private mapVariant(row: any): PromptVariant {
    return {
      id: row.id,
      agentRole: row.agent_role,
      variantName: row.variant_name,
      promptText: row.prompt_text,
      promptHash: row.prompt_hash,
      version: row.version,
      executionCount: row.execution_count,
      successCount: row.success_count,
      successRate: row.success_rate || 0,
      avgQualityScore: row.avg_quality_score,
      avgExecutionTimeMs: row.avg_execution_time_ms,
      avgCost: row.avg_cost,
      isActive: row.is_active,
      isChampion: row.is_champion,
      createdAt: row.created_at,
    };
  }
}

// Singleton instance
export const promptOptimizer = new PromptOptimizerService();
