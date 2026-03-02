import { Worker, type Job } from 'bullmq';
import { bullMQConnection } from '../connection.js';
import type { PublishJobData } from '../queues.js';
import { prisma } from '../../db/client.js';
import { getAdapter } from '../../adapters/registry.js';
import { getUserPlatformConnection } from '../../utils/token-manager.js';
import { ensureValidToken } from '../../middleware/token-refresh.js';
import { canPublish, recordPublish } from '../../adapters/rate-limiter.js';
import type { Platform, Post } from '@prisma/client';
import { emitPostPublished, emitPostFailed, emitPostStatusChange } from '../../services/event-emitter.js';
import { scheduleMetricsFetches } from '../../services/publish-service.js';

/**
 * Publish worker — processes individual platform publish jobs.
 * One job per platform per post = natural partial failure handling.
 */
export const publishWorker = new Worker<PublishJobData>(
  'publish-posts',
  async (job: Job<PublishJobData>) => {
    const { postId, platform, userId } = job.data;
    const platformEnum = platform as Platform;

    console.log(`[Publish] Processing ${platform} for post ${postId}`);

    // Update publish result status to PUBLISHING
    await prisma.publishResult.upsert({
      where: { postId_platform: { postId, platform: platformEnum } },
      update: { status: 'PUBLISHING' },
      create: {
        postId,
        platform: platformEnum,
        status: 'PUBLISHING',
      },
    });

    // Check rate limits
    const rateCheck = canPublish(platformEnum, userId);
    if (!rateCheck.allowed) {
      throw new Error(
        `Rate limited for ${platform}. Remaining: ${rateCheck.remaining}. ` +
        `Resets at: ${rateCheck.resetAt.toISOString()}`,
      );
    }

    // Get platform connection and ensure valid token
    const connection = await getUserPlatformConnection(userId, platformEnum);
    if (!connection || !connection.isActive) {
      await prisma.publishResult.update({
        where: { postId_platform: { postId, platform: platformEnum } },
        data: {
          status: 'FAILED',
          error: `No active ${platform} connection found. Please reconnect.`,
        },
      });
      throw new Error(`No active connection for ${platform}`);
    }

    const accessToken = await ensureValidToken(connection);

    // Get post content
    const post = await prisma.post.findUniqueOrThrow({
      where: { id: postId },
      include: {
        mediaAttachments: {
          include: { media: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    // Use platform override if available, otherwise main content
    const overrides = post.platformOverrides as Record<string, string> | null;
    const platformKey = platform.toLowerCase();
    const content = overrides?.[platformKey] || post.content;

    // Get adapter and validate
    const adapter = getAdapter(platformEnum);
    const mediaCount = post.mediaAttachments.length;
    const validation = adapter.validateContent(content, mediaCount);

    if (!validation.valid) {
      await prisma.publishResult.update({
        where: { postId_platform: { postId, platform: platformEnum } },
        data: {
          status: 'FAILED',
          error: `Validation failed: ${validation.errors.join(', ')}`,
        },
      });
      throw new Error(`Content validation failed for ${platform}: ${validation.errors.join(', ')}`);
    }

    // Collect media URLs
    const mediaUrls = post.mediaAttachments
      .filter((a) => a.media.status === 'READY')
      .map((a) => a.media.originalUrl);

    // Publish!
    // Instagram API needs the IG User ID (platformUserId), not the FB Page ID (platformPageId).
    // Facebook API needs the FB Page ID (platformPageId).
    const pageId = platformEnum === 'INSTAGRAM'
      ? connection.platformUserId || undefined
      : connection.platformPageId || connection.platformUserId || undefined;

    const result = await adapter.publish({
      accessToken,
      content,
      mediaUrls,
      pageId,
      platformSpecific: {
        memberUrn: connection.platformUserId,
      },
    });

    // Record the publish for rate limiting
    recordPublish(platformEnum, userId);

    // Update publish result
    await prisma.publishResult.update({
      where: { postId_platform: { postId, platform: platformEnum } },
      data: {
        status: 'SUCCESS',
        platformPostId: result.platformPostId,
        platformUrl: result.platformUrl,
        publishedAt: result.publishedAt,
      },
    });

    console.log(`[Publish] Successfully published to ${platform}: ${result.platformUrl || result.platformPostId}`);

    // Emit real-time event
    emitPostPublished(userId, postId, platform, result.platformPostId, result.platformUrl || null);

    // Schedule metrics fetches at 1h, 6h, 24h, 7d
    await scheduleMetricsFetches(
      `${postId}_${platform}`,
      result.platformPostId,
      platform,
      userId,
    );

    // Check if all platforms for this post are done
    await updatePostStatus(postId, userId);

    return result;
  },
  {
    ...bullMQConnection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 60000, // 10 jobs per minute max across all platforms
    },
  },
);

publishWorker.on('failed', async (job, error) => {
  if (!job) return;
  const { postId, platform } = job.data;

  const { userId } = job.data;
  console.error(`[Publish] Failed ${platform} for post ${postId}:`, error.message);

  // Update publish result with error
  await prisma.publishResult.update({
    where: { postId_platform: { postId, platform: platform as Platform } },
    data: {
      status: job.attemptsMade >= 3 ? 'FAILED' : 'RETRYING',
      error: error.message,
      retryCount: job.attemptsMade,
    },
  }).catch(() => {}); // Ignore if record doesn't exist

  // Emit real-time failure event
  if (job.attemptsMade >= 3) {
    emitPostFailed(userId, postId, platform, error.message);
  }

  // Update overall post status
  await updatePostStatus(postId, userId);
});

publishWorker.on('completed', (job) => {
  console.log(`[Publish] Job completed: ${job.data.platform} for post ${job.data.postId}`);
});

/**
 * Update the overall post status based on all publish results.
 */
async function updatePostStatus(postId: string, userId?: string): Promise<void> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { publishResults: true },
  });

  if (!post) return;

  const results = post.publishResults;
  const allDone = results.every((r) => ['SUCCESS', 'FAILED'].includes(r.status));

  if (!allDone) {
    // Still processing
    await prisma.post.update({
      where: { id: postId },
      data: { status: 'PUBLISHING' },
    });
    return;
  }

  const allSuccess = results.every((r) => r.status === 'SUCCESS');
  const allFailed = results.every((r) => r.status === 'FAILED');

  let status: 'PUBLISHED' | 'PARTIAL_FAILURE' | 'FAILED';
  if (allSuccess) status = 'PUBLISHED';
  else if (allFailed) status = 'FAILED';
  else status = 'PARTIAL_FAILURE';

  await prisma.post.update({
    where: { id: postId },
    data: { status },
  });

  // Emit status change event
  if (userId) {
    emitPostStatusChange(userId, postId, status);
  }
}
