import axios from 'axios';
import type { ApiResponse } from '@scc/shared';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('scc-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear auth and redirect to login
      localStorage.removeItem('scc-token');
      localStorage.removeItem('scc-user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export { api };

// ─── Auth ────────────────────────────────────────────────

export async function registerUser(data: { email: string; password: string; name?: string }) {
  const res = await api.post('/auth/register', data);
  return res.data.data as { token: string; user: { id: string; email: string; name: string | null } };
}

export async function loginUser(data: { email: string; password: string }) {
  const res = await api.post('/auth/login', data);
  return res.data.data as { token: string; user: { id: string; email: string; name: string | null } };
}

export async function fetchCurrentUser() {
  const res = await api.get('/auth/me');
  return res.data.data;
}

// ─── Connections ─────────────────────────────────────────

export async function fetchConnections() {
  const res = await api.get<ApiResponse<Array<{
    id: string;
    platform: string;
    platformUserId: string | null;
    platformPageId: string | null;
    platformName: string | null;
    scopes: string[];
    isActive: boolean;
    tokenExpiresAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>>>('/auth/connections');
  return res.data.data;
}

export async function disconnectPlatform(connectionId: string) {
  const res = await api.delete(`/auth/connections/${connectionId}`);
  return res.data;
}

// ─── Posts ────────────────────────────────────────────────

export async function createPost(data: {
  content: string;
  platforms: string[];
  platformOverrides?: Record<string, string>;
  scheduleType: string;
  scheduledAt?: string;
  mediaAssetIds?: string[];
  tags?: string[];
}) {
  const res = await api.post('/posts', data);
  return res.data.data;
}

export async function fetchPosts(params?: { status?: string; page?: number; limit?: number }) {
  const res = await api.get('/posts', { params });
  return res.data;
}

// ─── AI ──────────────────────────────────────────────────

export async function enhanceContent(data: { content: string; tone: string; platforms: string[] }) {
  const res = await api.post('/ai/enhance', data);
  return res.data.data;
}

export async function generateThread(data: { content: string; maxTweets?: number }) {
  const res = await api.post('/ai/thread', data);
  return res.data.data;
}

export async function generateVariants(data: { content: string; platforms: string[]; count?: number }) {
  const res = await api.post('/ai/variants', data);
  return res.data.data;
}

export async function brainstormPosts(data: { keywords: string[]; platforms: string[]; tone?: string; count?: number }) {
  const res = await api.post('/ai/brainstorm', data);
  return res.data.data as {
    posts: Array<{ content: string; platform: string; hook: string; hashtags: string[] }>;
  };
}

export async function generatePlatformPosts(data: { topic: string; platforms: string[]; tone?: string; context?: string }) {
  const res = await api.post('/ai/generate-posts', data);
  return res.data.data as {
    topic: string;
    posts: Array<{ platform: string; content: string; hashtags: string[]; charCount: number; tip: string }>;
  };
}
