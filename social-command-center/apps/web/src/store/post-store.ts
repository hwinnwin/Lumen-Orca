import { create } from 'zustand';

interface PublishResult {
  id: string;
  platform: string;
  status: string;
  platformPostId: string | null;
  platformUrl: string | null;
  publishedAt: string | null;
  error: string | null;
  metrics: Record<string, unknown> | null;
}

interface Post {
  id: string;
  content: string;
  platforms: string[];
  platformOverrides: Record<string, string> | null;
  status: string;
  scheduleType: string;
  scheduledAt: string | null;
  tags: string[];
  publishResults: PublishResult[];
  createdAt: string;
  updatedAt: string;
}

interface PostState {
  posts: Post[];
  total: number;
  page: number;
  loading: boolean;
  filter: string | null;

  setPosts: (posts: Post[], total: number) => void;
  addPost: (post: Post) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
  removePost: (id: string) => void;
  setPage: (page: number) => void;
  setFilter: (filter: string | null) => void;
  setLoading: (loading: boolean) => void;
  updatePublishResult: (postId: string, platform: string, result: Partial<PublishResult>) => void;
}

export const usePostStore = create<PostState>((set) => ({
  posts: [],
  total: 0,
  page: 1,
  loading: false,
  filter: null,

  setPosts: (posts, total) => set({ posts, total }),

  addPost: (post) =>
    set((state) => ({
      posts: [post, ...state.posts],
      total: state.total + 1,
    })),

  updatePost: (id, updates) =>
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  removePost: (id) =>
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== id),
      total: state.total - 1,
    })),

  setPage: (page) => set({ page }),
  setFilter: (filter) => set({ filter }),
  setLoading: (loading) => set({ loading }),

  updatePublishResult: (postId, platform, result) =>
    set((state) => ({
      posts: state.posts.map((post) => {
        if (post.id !== postId) return post;
        const existingIdx = post.publishResults.findIndex((r) => r.platform === platform);
        const publishResults = [...post.publishResults];
        if (existingIdx >= 0) {
          publishResults[existingIdx] = { ...publishResults[existingIdx], ...result };
        }
        return { ...post, publishResults };
      }),
    })),
}));

export type { Post, PublishResult };
