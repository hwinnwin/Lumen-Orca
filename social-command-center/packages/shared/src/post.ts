import type { PlatformId } from './platforms.js';

export enum PostStatus {
  DRAFT = 'DRAFT',
  QUEUED = 'QUEUED',
  PUBLISHING = 'PUBLISHING',
  PUBLISHED = 'PUBLISHED',
  PARTIAL_FAILURE = 'PARTIAL_FAILURE',
  FAILED = 'FAILED',
}

export enum PublishStatus {
  PENDING = 'PENDING',
  PUBLISHING = 'PUBLISHING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

export enum ScheduleType {
  IMMEDIATE = 'IMMEDIATE',
  SCHEDULED = 'SCHEDULED',
  OPTIMAL = 'OPTIMAL',
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  platformOverrides: Partial<Record<PlatformId, string>>;
  platforms: PlatformId[];
  mediaAssetIds: string[];
  scheduleType: ScheduleType;
  scheduledAt: string | null;
  timezone: string;
  status: PostStatus;
  tags: string[];
  aiEnhancement: AiEnhancementData | null;
  publishResults: PublishResult[];
  createdAt: string;
  updatedAt: string;
}

export interface PublishResult {
  id: string;
  postId: string;
  platform: PlatformId;
  status: PublishStatus;
  platformPostId: string | null;
  platformUrl: string | null;
  error: string | null;
  retryCount: number;
  publishedAt: string | null;
  metrics: PostMetrics | null;
  createdAt: string;
  updatedAt: string;
}

export interface PostMetrics {
  impressions?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  reach?: number;
  saves?: number;
  clicks?: number;
}

export interface AiEnhancementData {
  originalContent: string;
  enhancedContent: string;
  tone: string;
  hashtags: string[];
  platformTips: Partial<Record<PlatformId, string>>;
}

export interface CreatePostRequest {
  content: string;
  platforms: PlatformId[];
  platformOverrides?: Partial<Record<PlatformId, string>>;
  mediaAssetIds?: string[];
  scheduleType: ScheduleType;
  scheduledAt?: string;
  timezone?: string;
  tags?: string[];
  aiEnhancement?: AiEnhancementData;
}

export interface QueueItem {
  id: string;
  postId: string;
  platform: PlatformId;
  status: PublishStatus;
  attempts: number;
  lastError: string | null;
  nextRetryAt: string | null;
}
