/**
 * Feedback Service
 * Enables human-in-the-loop learning for the Lumen-Orca self-improvement system
 *
 * Features:
 * - Collect ratings on agent outputs (1-5 stars)
 * - Capture corrections for learning
 * - Submit feedback directly to the meta-learner
 * - Track feedback trends over time
 */

import { supabase } from '@/integrations/supabase/client';

export type FeedbackType =
  | 'output_quality'
  | 'prompt_accuracy'
  | 'speed'
  | 'cost'
  | 'overall';

export interface FeedbackSubmission {
  executionId: string;
  agentRole: string;
  taskId?: string;
  rating: number; // 1-5
  feedbackType: FeedbackType;
  comment?: string;
  expectedOutput?: string; // What should have been produced
}

export interface FeedbackSummary {
  agentRole: string;
  totalFeedback: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  recentTrend: 'improving' | 'stable' | 'declining';
}

class FeedbackService {
  /**
   * Submit feedback for an agent execution
   */
  async submitFeedback(feedback: FeedbackSubmission): Promise<boolean> {
    try {
      // Validate rating
      if (feedback.rating < 1 || feedback.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Insert feedback
      const { error: feedbackError } = await supabase
        .from('agent_feedback')
        .insert({
          execution_id: feedback.executionId,
          agent_role: feedback.agentRole,
          task_id: feedback.taskId,
          rating: feedback.rating,
          feedback_type: feedback.feedbackType,
          comment: feedback.comment,
          expected_output: feedback.expectedOutput,
        });

      if (feedbackError) {
        console.error('[FeedbackService] Failed to insert feedback:', feedbackError);
        return false;
      }

      // Update execution history with rating
      const { error: updateError } = await supabase
        .from('agent_execution_history')
        .update({
          user_rating: feedback.rating,
          user_feedback: feedback.comment,
        })
        .eq('id', feedback.executionId);

      if (updateError) {
        console.warn('[FeedbackService] Failed to update execution history:', updateError);
        // Don't return false - the feedback was still recorded
      }

      console.log(`[FeedbackService] Recorded feedback for ${feedback.agentRole}: ${feedback.rating}/5`);
      return true;
    } catch (error) {
      console.error('[FeedbackService] Error submitting feedback:', error);
      return false;
    }
  }

  /**
   * Get feedback summary for an agent
   */
  async getAgentFeedbackSummary(agentRole: string): Promise<FeedbackSummary | null> {
    try {
      const { data, error } = await supabase
        .from('agent_feedback')
        .select('rating, created_at')
        .eq('agent_role', agentRole)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[FeedbackService] Failed to fetch feedback:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return {
          agentRole,
          totalFeedback: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          recentTrend: 'stable',
        };
      }

      // Calculate statistics
      const totalFeedback = data.length;
      const averageRating = data.reduce((sum, f) => sum + f.rating, 0) / totalFeedback;

      // Rating distribution
      const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const feedback of data) {
        ratingDistribution[feedback.rating] = (ratingDistribution[feedback.rating] || 0) + 1;
      }

      // Calculate trend (compare first half vs second half of recent feedback)
      let recentTrend: 'improving' | 'stable' | 'declining' = 'stable';
      if (data.length >= 10) {
        const midpoint = Math.floor(data.length / 2);
        const recentHalf = data.slice(0, midpoint);
        const olderHalf = data.slice(midpoint);

        const recentAvg = recentHalf.reduce((sum, f) => sum + f.rating, 0) / recentHalf.length;
        const olderAvg = olderHalf.reduce((sum, f) => sum + f.rating, 0) / olderHalf.length;

        if (recentAvg - olderAvg > 0.3) recentTrend = 'improving';
        else if (olderAvg - recentAvg > 0.3) recentTrend = 'declining';
      }

      return {
        agentRole,
        totalFeedback,
        averageRating,
        ratingDistribution,
        recentTrend,
      };
    } catch (error) {
      console.error('[FeedbackService] Error getting summary:', error);
      return null;
    }
  }

  /**
   * Get all feedback summaries for dashboard
   */
  async getAllAgentFeedbackSummaries(): Promise<FeedbackSummary[]> {
    try {
      const { data, error } = await supabase
        .from('agent_feedback')
        .select('agent_role, rating, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[FeedbackService] Failed to fetch all feedback:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Group by agent
      const byAgent = new Map<string, { rating: number; created_at: string }[]>();
      for (const feedback of data) {
        const existing = byAgent.get(feedback.agent_role) || [];
        existing.push(feedback);
        byAgent.set(feedback.agent_role, existing);
      }

      // Calculate summaries
      const summaries: FeedbackSummary[] = [];
      for (const [agentRole, feedbacks] of byAgent) {
        const totalFeedback = feedbacks.length;
        const averageRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedback;

        const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (const feedback of feedbacks) {
          ratingDistribution[feedback.rating] = (ratingDistribution[feedback.rating] || 0) + 1;
        }

        let recentTrend: 'improving' | 'stable' | 'declining' = 'stable';
        if (feedbacks.length >= 10) {
          const midpoint = Math.floor(feedbacks.length / 2);
          const recentHalf = feedbacks.slice(0, midpoint);
          const olderHalf = feedbacks.slice(midpoint);

          const recentAvg = recentHalf.reduce((sum, f) => sum + f.rating, 0) / recentHalf.length;
          const olderAvg = olderHalf.reduce((sum, f) => sum + f.rating, 0) / olderHalf.length;

          if (recentAvg - olderAvg > 0.3) recentTrend = 'improving';
          else if (olderAvg - recentAvg > 0.3) recentTrend = 'declining';
        }

        summaries.push({
          agentRole,
          totalFeedback,
          averageRating,
          ratingDistribution,
          recentTrend,
        });
      }

      return summaries.sort((a, b) => b.totalFeedback - a.totalFeedback);
    } catch (error) {
      console.error('[FeedbackService] Error getting all summaries:', error);
      return [];
    }
  }

  /**
   * Get low-rated executions that need attention
   */
  async getLowRatedExecutions(
    minRating: number = 1,
    maxRating: number = 2,
    limit: number = 20
  ): Promise<Array<{
    executionId: string;
    agentRole: string;
    rating: number;
    comment: string | null;
    expectedOutput: string | null;
    createdAt: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('agent_feedback')
        .select('execution_id, agent_role, rating, comment, expected_output, created_at')
        .gte('rating', minRating)
        .lte('rating', maxRating)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[FeedbackService] Failed to fetch low-rated executions:', error);
        return [];
      }

      return (data || []).map(f => ({
        executionId: f.execution_id,
        agentRole: f.agent_role,
        rating: f.rating,
        comment: f.comment,
        expectedOutput: f.expected_output,
        createdAt: f.created_at,
      }));
    } catch (error) {
      console.error('[FeedbackService] Error getting low-rated executions:', error);
      return [];
    }
  }

  /**
   * Mark a correction as applied (for learning tracking)
   */
  async markCorrectionApplied(feedbackId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('agent_feedback')
        .update({ correction_applied: true })
        .eq('id', feedbackId);

      if (error) {
        console.error('[FeedbackService] Failed to mark correction applied:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[FeedbackService] Error marking correction:', error);
      return false;
    }
  }
}

// Singleton instance
export const feedbackService = new FeedbackService();

// Quick submit function for convenience
export async function submitAgentFeedback(
  executionId: string,
  agentRole: string,
  rating: number,
  feedbackType: FeedbackType = 'overall',
  comment?: string
): Promise<boolean> {
  return feedbackService.submitFeedback({
    executionId,
    agentRole,
    rating,
    feedbackType,
    comment,
  });
}
