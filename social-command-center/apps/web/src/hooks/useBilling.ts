import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSubscription, createCheckoutSession, createPortalSession, cancelSubscription, resumeSubscription, fetchAutoTopUpSettings, updateAutoTopUpSettings } from '../services/api';
import { useAuthStore, type SubscriptionTier } from '../store/auth-store';

const TIER_LEVELS: Record<string, number> = {
  FREE: 0,
  PRO: 1,
  PREMIUM: 2,
  POWER: 3,
};

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: fetchSubscription,
    staleTime: 60_000,
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: (tier: string) => createCheckoutSession(tier),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });
}

export function usePortal() {
  return useMutation({
    mutationFn: () => createPortalSession(),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}

export function useResumeSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => resumeSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}

export function useAutoTopUp() {
  return useQuery({
    queryKey: ['auto-topup'],
    queryFn: fetchAutoTopUpSettings,
    staleTime: 60_000,
  });
}

export function useUpdateAutoTopUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { enabled: boolean; threshold?: number; amount?: number }) =>
      updateAutoTopUpSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-topup'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}

export function useTierAccess() {
  const user = useAuthStore((s) => s.user);
  const tier = (user?.tier || 'FREE') as SubscriptionTier;

  return {
    tier,
    hasAccess: (requiredTier: string) => {
      return (TIER_LEVELS[tier] ?? 0) >= (TIER_LEVELS[requiredTier] ?? 0);
    },
  };
}
