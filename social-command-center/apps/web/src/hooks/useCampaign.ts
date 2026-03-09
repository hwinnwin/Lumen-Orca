import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  generateCampaignPlan,
  generateCampaignBatch,
  bulkCreatePosts,
  type CampaignPostOutline,
} from '../services/api';

export function useCampaignPlan() {
  return useMutation({
    mutationFn: (data: {
      topic: string;
      platforms: string[];
      tone?: string;
      audience?: string;
      brandGuidance?: string;
      postCount?: number;
    }) => generateCampaignPlan(data),
  });
}

export function useCampaignBatch() {
  return useMutation({
    mutationFn: (data: {
      topic: string;
      tone?: string;
      audience?: string;
      brandGuidance?: string;
      outlines: CampaignPostOutline[];
    }) => generateCampaignBatch(data),
  });
}

export function useBulkCreatePosts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      requestId?: string;
      posts: Array<{
        content: string;
        platforms: string[];
        scheduleType: string;
        scheduledAt?: string;
        tags?: string[];
      }>;
    }) => bulkCreatePosts(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
