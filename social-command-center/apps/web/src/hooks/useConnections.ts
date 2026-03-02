import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchConnections, disconnectPlatform } from '../services/api';
import type { PlatformId } from '@scc/shared';

export function useConnections() {
  return useQuery({
    queryKey: ['connections'],
    queryFn: fetchConnections,
    refetchInterval: 60_000, // Poll every 60 seconds
  });
}

export function useDisconnect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disconnectPlatform,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}

export function useIsConnected(platformId: PlatformId) {
  const { data: connections } = useConnections();
  if (!connections) return false;
  const platformMap: Record<PlatformId, string> = {
    facebook: 'FACEBOOK',
    instagram: 'INSTAGRAM',
    linkedin: 'LINKEDIN',
    x: 'X',
    tiktok: 'TIKTOK',
    youtube: 'YOUTUBE',
  };
  return connections.some(
    (c) => c.platform === platformMap[platformId] && c.isActive,
  );
}
