import { Queue } from 'bullmq';
import { bullMQConnection } from './connection.js';

export const publishQueue = new Queue('publish-posts', bullMQConnection);
export const mediaProcessQueue = new Queue('process-media', bullMQConnection);
export const metricsQueue = new Queue('fetch-metrics', bullMQConnection);
export const schedulerQueue = new Queue('post-scheduler', bullMQConnection);
export const videoGenerateQueue = new Queue('video-generate', bullMQConnection);
export const videoExportQueue = new Queue('video-export', bullMQConnection);

// Types for job data
export interface PublishJobData {
  postId: string;
  platform: string; // Platform enum value
  userId: string;
}

export interface MediaProcessJobData {
  mediaId: string;
  userId: string;
}

export interface MetricsJobData {
  publishResultId: string;
  platformPostId: string;
  platform: string;
  userId: string;
}

export interface VideoExportJobData {
  clips: Array<{ storageKey: string; startTime?: number; endTime?: number }>;
  audioStorageKey?: string;
  audioVolume: number;
  userId: string;
  jobId: string;
  // AI-generated audio (generated server-side during export)
  musicStyle?: string;
  voiceoverScript?: string;
  voiceoverVoice?: string;
}

export interface VideoGenerateJobData {
  prompt: string;
  sourceImageUrl?: string;
  duration: 6 | 10;
  aspectRatio: '9:16' | '1:1' | '16:9';
  userId: string;
  jobId: string;
  // Multi-segment + audio fields
  segments?: Array<{ segmentNumber: number; prompt: string; duration: 6 | 10 }>;
  totalDuration?: number;
  voiceoverScript?: string;
  voiceoverVoice?: string;
  musicStyle?: string;
  enableCaptions?: boolean;
}
