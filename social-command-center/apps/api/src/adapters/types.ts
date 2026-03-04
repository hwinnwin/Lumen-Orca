import type { Platform } from '@prisma/client';

export interface PublishParams {
  accessToken: string;
  content: string;
  mediaUrls?: string[];
  platformMediaIds?: string[];
  format?: string;
  pageId?: string;         // Facebook page ID, Instagram user ID
  memberUrn?: string;      // LinkedIn member URN
  platformSpecific?: Record<string, unknown>;
}

export interface PublishResponse {
  platformPostId: string;
  platformUrl: string | null;
  publishedAt: Date;
}

export interface MediaUploadParams {
  accessToken: string;
  fileBuffer: Buffer;
  mimeType: string;
  filename: string;
  pageId?: string;
}

export interface MediaUploadResponse {
  platformMediaId: string;
  url?: string;
  isVideo?: boolean; // Facebook: video was published during upload (no separate feed post needed)
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

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PlatformAdapter {
  platform: Platform;

  /** Validate content meets platform requirements */
  validateContent(content: string, mediaCount?: number): ValidationResult;

  /** Upload media to the platform (returns platform-specific media ID) */
  uploadMedia(params: MediaUploadParams): Promise<MediaUploadResponse>;

  /** Publish a post to the platform */
  publish(params: PublishParams): Promise<PublishResponse>;

  /** Fetch engagement metrics for a published post */
  getMetrics(platformPostId: string, accessToken: string): Promise<PostMetrics>;
}
