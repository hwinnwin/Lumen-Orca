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

// ─── Marketing AI ───────────────────────────────────────

export async function generateContentStrategy(data: {
  brand: string;
  niche: string;
  audience: string;
  goals: string[];
  platforms: string[];
}) {
  const res = await api.post('/ai/strategy', data, { timeout: 60000 });
  return res.data.data;
}

export async function generateHooks(data: { topic: string; platform?: string; count?: number }) {
  const res = await api.post('/ai/hooks', data, { timeout: 30000 });
  return res.data.data as {
    hooks: Array<{ text: string; type: string; whyItWorks: string; bestFor: string }>;
  };
}

export async function repurposeContent(data: {
  content: string;
  originalPlatform: string;
  targetPlatforms: string[];
}) {
  const res = await api.post('/ai/repurpose', data, { timeout: 60000 });
  return res.data.data as {
    repurposed: Array<{ platform: string; format: string; content: string; adaptationNotes: string }>;
  };
}

// ─── Post Editing ────────────────────────────────────────

export async function updatePost(postId: string, data: {
  content?: string;
  platforms?: string[];
  platformOverrides?: Record<string, string>;
  scheduleType?: string;
  scheduledAt?: string | null;
  mediaAssetIds?: string[];
  tags?: string[];
}) {
  const res = await api.patch(`/posts/${postId}`, data);
  return res.data.data;
}

// ─── Settings ────────────────────────────────────────────

export interface UserSettings {
  id: string;
  email: string;
  name: string | null;
  timezone: string;
  settings: {
    defaultTone?: string;
    defaultPlatforms?: string[];
    notificationsEnabled?: boolean;
  } | null;
  createdAt: string;
}

export async function fetchSettings() {
  const res = await api.get('/settings');
  return res.data.data as UserSettings;
}

export async function updateSettings(data: {
  name?: string;
  timezone?: string;
  settings?: Record<string, unknown>;
}) {
  const res = await api.patch('/settings', data);
  return res.data.data as UserSettings;
}

export async function changePassword(data: { currentPassword: string; newPassword: string }) {
  const res = await api.post('/settings/change-password', data);
  return res.data.data;
}

// ─── Generator ──────────────────────────────────────────

export interface SlidePlan {
  slideNumber: number;
  title: string;
  body: string;
  imagePrompt: string;
  backgroundColor: string;
  textColor: string;
}

export interface CarouselPlan {
  topic: string;
  caption: string;
  hashtags: string[];
  slides: SlidePlan[];
}

export interface GeneratedSlide {
  slideNumber: number;
  title: string;
  body: string;
  imageUrl: string;
  storageKey: string;
}

export async function fetchGeneratorCapabilities() {
  const res = await api.get('/generator/capabilities');
  return res.data.data as { aiImages: boolean; message: string };
}

export async function generateCarouselPlan(data: {
  topic: string;
  contentType?: string;
  slideCount?: number;
  tone?: string;
}) {
  const res = await api.post('/generator/plan', data, { timeout: 60000 });
  return res.data.data as CarouselPlan;
}

export async function generateCarouselSlides(data: { plan: CarouselPlan }) {
  const res = await api.post('/generator/generate', data, { timeout: 300000 });
  return res.data.data as { slides: GeneratedSlide[]; caption: string; hashtags: string[] };
}

export async function regenerateSlide(data: { slide: SlidePlan }) {
  const res = await api.post('/generator/regenerate-slide', data, { timeout: 120000 });
  return res.data.data as GeneratedSlide;
}

export async function generateQuoteCard(data: {
  quote: string;
  author: string;
  style?: { backgroundColor?: string; textColor?: string; accentColor?: string };
}) {
  const res = await api.post('/generator/quote-card', data, { timeout: 60000 });
  return res.data.data as { imageUrl: string; storageKey: string };
}
