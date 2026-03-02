import { prisma } from '../db/client.js';
import { publishQueue, metricsQueue } from '../queue/queues.js';
import type { Platform, Post } from '@prisma/client';

/**
 * Publish service — orchestrates post creation, publishing, and queue management.
 */

/**
 * Enqueue publish jobs for all platforms on a post.
 * Creates one BullMQ job per platform for natural partial-failure handling.
 */
export async function enqueuePublishJobs(post: Post): Promise<void> {
  const jobs = post.platforms.map((platform) => ({
    name: `publish-${platform.toLowerCase()}-${post.id}`,
    data: {
      postId: post.id,
      platform,
      userId: post.userId,
    },
    opts: {
      attempts: 3,
      backoff: { type: 'exponential' as const, delay: 30_000 },
      removeOnComplete: { age: 7 * 24 * 3600 },
      removeOnFail: { age: 30 * 24 * 3600 },
    },
  }));

  await publishQueue.addBulk(jobs);

  console.log(
    `[Publish] Enqueued ${jobs.length} jobs for post ${post.id}: ${post.platforms.join(', ')}`,
  );
}

/**
 * Schedule metrics fetches at 1h, 6h, 24h, and 7d after publish.
 */
export async function scheduleMetricsFetches(
  publishResultId: string,
  platformPostId: string,
  platform: string,
  userId: string,
): Promise<void> {
  const delays = [
    { label: '1h', ms: 60 * 60 * 1000 },
    { label: '6h', ms: 6 * 60 * 60 * 1000 },
    { label: '24h', ms: 24 * 60 * 60 * 1000 },
    { label: '7d', ms: 7 * 24 * 60 * 60 * 1000 },
  ];

  const jobs = delays.map(({ label, ms }) => ({
    name: `metrics-${platform.toLowerCase()}-${label}-${publishResultId}`,
    data: { publishResultId, platformPostId, platform, userId },
    opts: { delay: ms, removeOnComplete: { age: 7 * 24 * 3600 } },
  }));

  await metricsQueue.addBulk(jobs);
}

/**
 * Publish a post immediately — sets status to QUEUED and enqueues jobs.
 */
export async function publishNow(postId: string, userId: string): Promise<Post> {
  const post = await prisma.post.findFirst({
    where: { id: postId, userId },
  });

  if (!post) throw new Error('Post not found');

  if (!['DRAFT', 'QUEUED', 'FAILED'].includes(post.status)) {
    throw new Error('Post cannot be published in its current state');
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { status: 'QUEUED', scheduleType: 'IMMEDIATE' },
  });

  await enqueuePublishJobs(updated);
  return updated;
}

/**
 * Cancel a scheduled post — removes from queue and resets to DRAFT.
 */
export async function cancelScheduled(postId: string, userId: string): Promise<Post> {
  const post = await prisma.post.findFirst({
    where: { id: postId, userId },
  });

  if (!post) throw new Error('Post not found');

  if (!['DRAFT', 'QUEUED'].includes(post.status)) {
    throw new Error('Cannot cancel a post that is already publishing or published');
  }

  // Remove pending jobs from the queue
  const jobs = await publishQueue.getJobs(['waiting', 'delayed']);
  for (const job of jobs) {
    if (job.data.postId === postId) {
      await job.remove();
    }
  }

  return prisma.post.update({
    where: { id: postId },
    data: { status: 'DRAFT', scheduleType: 'IMMEDIATE', scheduledAt: null },
  });
}

/**
 * Get detailed publish status for a post across all platforms.
 */
export async function getPostStatus(postId: string, userId: string) {
  const post = await prisma.post.findFirst({
    where: { id: postId, userId },
    include: { publishResults: true },
  });

  if (!post) throw new Error('Post not found');

  // Get active BullMQ jobs for this post
  const activeJobs = await publishQueue.getJobs(['active', 'waiting', 'delayed']);
  const postJobs = activeJobs.filter((j) => j.data.postId === postId);

  return {
    post,
    platforms: post.platforms.map((platform) => {
      const result = post.publishResults.find((r) => r.platform === platform);
      const activeJob = postJobs.find((j) => j.data.platform === platform);

      return {
        platform,
        status: result?.status || (activeJob ? 'PENDING' : 'NOT_STARTED'),
        publishedAt: result?.publishedAt,
        platformPostId: result?.platformPostId,
        platformUrl: result?.platformUrl,
        error: result?.error,
        metrics: result?.metrics,
        metricsFetchedAt: result?.metricsFetchedAt,
      };
    }),
  };
}
