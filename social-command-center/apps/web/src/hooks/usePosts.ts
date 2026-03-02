import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { usePostStore } from '../store/post-store';

export function usePosts(params?: { status?: string; page?: number; limit?: number }) {
  const { setPosts, setLoading } = usePostStore();

  return useQuery({
    queryKey: ['posts', params],
    queryFn: async () => {
      setLoading(true);
      try {
        const res = await api.get('/posts', { params });
        const { data, meta } = res.data;
        setPosts(data, meta.total);
        return { data, meta };
      } finally {
        setLoading(false);
      }
    },
    refetchInterval: 10_000,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { addPost } = usePostStore();

  return useMutation({
    mutationFn: async (data: {
      content: string;
      platforms: string[];
      platformOverrides?: Record<string, string>;
      scheduleType: string;
      scheduledAt?: string;
      mediaAssetIds?: string[];
      tags?: string[];
    }) => {
      const res = await api.post('/posts', data);
      return res.data.data;
    },
    onSuccess: (post) => {
      addPost(post);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function usePublishPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await api.post(`/posts/${postId}/publish`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useCancelPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await api.post(`/posts/${postId}/cancel`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  const { removePost } = usePostStore();

  return useMutation({
    mutationFn: async (postId: string) => {
      await api.delete(`/posts/${postId}`);
      return postId;
    },
    onSuccess: (postId) => {
      removePost(postId);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  const { updatePost } = usePostStore();

  return useMutation({
    mutationFn: async ({
      postId,
      data,
    }: {
      postId: string;
      data: {
        content?: string;
        platforms?: string[];
        platformOverrides?: Record<string, string>;
        scheduleType?: string;
        scheduledAt?: string | null;
        mediaAssetIds?: string[];
        tags?: string[];
      };
    }) => {
      const res = await api.patch(`/posts/${postId}`, data);
      return res.data.data;
    },
    onSuccess: (post) => {
      updatePost(post.id, post);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
