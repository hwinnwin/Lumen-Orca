import { Queue } from 'bullmq';
import { bullMQConnection } from './connection.js';

export const publishQueue = new Queue('publish-posts', bullMQConnection);
export const mediaProcessQueue = new Queue('process-media', bullMQConnection);
export const metricsQueue = new Queue('fetch-metrics', bullMQConnection);
export const schedulerQueue = new Queue('post-scheduler', bullMQConnection);

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
