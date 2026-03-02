import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { initSocket, disconnectSocket } from '../services/socket';
import { usePostStore } from '../store/post-store';
import { useUIStore } from '../store/ui-store';
import { PLATFORMS } from '@scc/shared';

/**
 * Hook that establishes Socket.io connection and subscribes to real-time events.
 * Call this once in your root component.
 */
export function useSocket() {
  const queryClient = useQueryClient();
  const { updatePost, updatePublishResult } = usePostStore();
  const { addNotification } = useUIStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const socket = initSocket();

    // Post status changed
    socket.on('post:status', (data: { postId: string; status: string }) => {
      updatePost(data.postId, { status: data.status });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    });

    // Post published on a platform
    socket.on(
      'post:published',
      (data: {
        postId: string;
        platform: string;
        platformPostId: string;
        platformUrl: string | null;
      }) => {
        updatePublishResult(data.postId, data.platform, {
          status: 'SUCCESS',
          platformPostId: data.platformPostId,
          platformUrl: data.platformUrl,
          publishedAt: new Date().toISOString(),
        });
        queryClient.invalidateQueries({ queryKey: ['posts'] });

        const platformConfig = PLATFORMS.find(
          (p) => p.id === data.platform.toLowerCase(),
        );
        toast.success(`Published to ${platformConfig?.name || data.platform}`, {
          description: data.platformUrl ? 'Your post is live!' : undefined,
          action: data.platformUrl
            ? {
                label: 'View Post',
                onClick: () => window.open(data.platformUrl!, '_blank'),
              }
            : undefined,
        });
        addNotification({
          type: 'success',
          title: `Published to ${platformConfig?.name || data.platform}`,
          message: `Post ${data.postId.slice(0, 8)}... is live`,
        });
      },
    );

    // Post failed on a platform
    socket.on(
      'post:failed',
      (data: { postId: string; platform: string; error: string }) => {
        updatePublishResult(data.postId, data.platform, {
          status: 'FAILED',
          error: data.error,
        });
        queryClient.invalidateQueries({ queryKey: ['posts'] });

        const platformConfig = PLATFORMS.find(
          (p) => p.id === data.platform.toLowerCase(),
        );
        toast.error(`Failed on ${platformConfig?.name || data.platform}`, {
          description: data.error,
        });
        addNotification({
          type: 'error',
          title: `Failed on ${platformConfig?.name || data.platform}`,
          message: data.error,
        });
      },
    );

    // Media processed
    socket.on(
      'media:processed',
      (data: { mediaId: string; status: string }) => {
        if (data.status === 'READY') {
          toast.success('Media processed successfully');
        } else if (data.status === 'FAILED') {
          toast.error('Media processing failed');
        }
        addNotification({
          type: data.status === 'READY' ? 'success' : 'error',
          title: 'Media Processing',
          message: data.status === 'READY' ? 'Your media is ready' : 'Processing failed',
        });
      },
    );

    // Metrics updated
    socket.on(
      'metrics:updated',
      (_data: { postId: string; platform: string; metrics: unknown }) => {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      },
    );

    return () => {
      disconnectSocket();
      initialized.current = false;
    };
  }, [queryClient, updatePost, updatePublishResult, addNotification]);
}
