import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCreditBalance, fetchCreditHistory, fetchCreditCosts, topUpCredits } from '../services/api';

export function useCreditBalance() {
  return useQuery({
    queryKey: ['credit-balance'],
    queryFn: fetchCreditBalance,
    refetchInterval: 30000, // Refresh every 30s
  });
}

export function useCreditHistory(opts?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['credit-history', opts],
    queryFn: () => fetchCreditHistory(opts),
  });
}

export function useCreditCosts() {
  return useQuery({
    queryKey: ['credit-costs'],
    queryFn: fetchCreditCosts,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useTopUpCredits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { amount: number; description?: string }) => topUpCredits(data.amount, data.description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-balance'] });
      queryClient.invalidateQueries({ queryKey: ['credit-history'] });
    },
  });
}

/**
 * Hook to invalidate credit balance after a generation completes.
 * Call this in mutation onSuccess/onError callbacks.
 */
export function useInvalidateCredits() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['credit-balance'] });
  };
}
