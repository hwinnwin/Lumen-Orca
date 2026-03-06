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
import { isS3Configured, readFromLocalStorage } from '../../services/s3.js';
import { buildPublicMediaUrl } from '../../utils/signed-media-url.js';

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

    // YouTube title: use explicit title from overrides, fall back to content substring
    const youtubeTitle = overrides?.['__youtubeTitle'] || content.substring(0, 100) || 'Untitled Video';

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

    // Collect media URLs — only READY media with valid URLs
    const readyMedia = post.mediaAttachments.filter((a) => a.media.status === 'READY' && a.media.originalUrl);

    // For platforms that need publicly accessible URLs (Instagram, Facebook),
    // generate signed public URLs when using local storage.
    // S3 URLs are already public; local URLs like /api/media/local/... are not.
    const needsPublicUrls = ['INSTAGRAM', 'FACEBOOK'].includes(platform);
    const mediaUrls = readyMedia.map((a) => {
      const url = a.media.originalUrl;
      if (needsPublicUrls && !isS3Configured && url.startsWith('/')) {
        // Local relative URL — convert to a signed public URL using the media key
        console.log(`[Publish] Converting local URL to signed public URL for ${platform}: ${a.media.originalKey}`);
        return buildPublicMediaUrl(a.media.originalKey);
      }
      return url;
    });

    // Detect media type (for Instagram Reels detection)
    const hasVideo = readyMedia.some((a) => a.media.type === 'VIDEO' || a.media.mimeType?.startsWith('video/'));
    const mediaType = hasVideo ? 'REELS' : 'IMAGE';

    console.log(`[Publish] ${platform}: ${mediaUrls.length} media URLs (${mediaType}), attachments total: ${post.mediaAttachments.length}`);
    if (mediaUrls.length > 0) {
      console.log(`[Publish] Media URLs:`, mediaUrls.map((u) => u.substring(0, 80)).join(', '));
    }

    // YouTube only supports video uploads — reject early with a clear message
    if (platformEnum === 'YOUTUBE' && !hasVideo) {
      const msg = 'YouTube only supports video posts. Please attach a video to publish to YouTube.';
      await prisma.publishResult.update({
        where: { postId_platform: { postId, platform: platformEnum } },
        data: { status: 'FAILED', error: msg },
      });
      throw new Error(msg);
    }

    // Instagram/Facebook API needs the correct page/user ID
    const pageId = platformEnum === 'INSTAGRAM'
      ? connection.platformUserId || undefined
      : connection.platformPageId || connection.platformUserId || undefined;

    // Facebook requires pre-uploading media to get IDs.
    // For videos: upload publishes directly (description included in finish phase).
    // For images: upload as unpublished, then attach via feed post.
    // Instagram uses media URLs directly in the publish call.
    let platformMediaIds: string[] | undefined;

    if (platformEnum === 'FACEBOOK' && mediaUrls.length > 0 && pageId) {
      console.log(`[Publish] Facebook: uploading ${mediaUrls.length} media item(s) (${mediaType})`);
      platformMediaIds = [];
      for (const [idx, url] of mediaUrls.entries()) {
        try {
          const mediaAttachment = readyMedia[idx];
          const mimeType = mediaAttachment?.media.mimeType || 'image/png';
          const isVideoFile = mimeType.startsWith('video/');

          let fileBuffer: Buffer;
          if (!isS3Configured && mediaAttachment?.media.originalKey) {
            const localBuf = await readFromLocalStorage(mediaAttachment.media.originalKey);
            if (!localBuf) {
              console.warn(`[Publish] Facebook: could not read local file for key ${mediaAttachment.media.originalKey}`);
              continue;
            }
            fileBuffer = localBuf;
          } else {
            const response = await fetch(url);
            if (!response.ok) {
              console.warn(`[Publish] Facebook: failed to fetch media from ${url.substring(0, 80)}: ${response.status}`);
              continue;
            }
            fileBuffer = Buffer.from(await response.arrayBuffer());
          }

          // For videos, pass the post content as description (published during upload).
          // For images, upload as unpublished (will attach via feed post).
          const uploadParams = {
            accessToken,
            fileBuffer,
            mimeType,
            filename: mediaAttachment?.media.originalKey?.split('/').pop() || `media-${idx}.${isVideoFile ? 'mp4' : 'png'}`,
            pageId,
            ...(isVideoFile ? { description: content } : {}),
          };

          const uploadResult = await adapter.uploadMedia(uploadParams as unknown as Parameters<typeof adapter.uploadMedia>[0]);

          platformMediaIds.push(uploadResult.platformMediaId);
          console.log(`[Publish] Facebook: uploaded ${isVideoFile ? 'video' : 'image'} ${idx + 1}/${mediaUrls.length}, id: ${uploadResult.platformMediaId}`);
        } catch (err) {
          console.error(`[Publish] Facebook: failed to upload media ${idx + 1}:`, err);
        }
      }
      console.log(`[Publish] Facebook: ${platformMediaIds.length}/${mediaUrls.length} media items uploaded`);
    }

    // YouTube requires downloading the video into a buffer for resumable upload
    let videoBuffer: Buffer | undefined;
    if (platformEnum === 'YOUTUBE' && mediaUrls.length > 0 && hasVideo) {
      const videoAttachment = readyMedia.find((a) => a.media.type === 'VIDEO' || a.media.mimeType?.startsWith('video/'));
      if (videoAttachment) {
        if (!isS3Configured && videoAttachment.media.originalKey) {
          const localBuf = await readFromLocalStorage(videoAttachment.media.originalKey);
          if (localBuf) {
            videoBuffer = localBuf;
          }
        }
        if (!videoBuffer) {
          const videoUrl = videoAttachment.media.originalUrl;
          const response = await fetch(videoUrl);
          if (response.ok) {
            videoBuffer = Buffer.from(await response.arrayBuffer());
          }
        }
        if (!videoBuffer) {
          throw new Error('YouTube: failed to download video for upload');
        }
        console.log(`[Publish] YouTube: downloaded video buffer (${(videoBuffer.length / 1024 / 1024).toFixed(1)} MB)`);
      }
    }

    const result = await adapter.publish({
      accessToken,
      content,
      mediaUrls,
      platformMediaIds,
      pageId,
      platformSpecific: {
        memberUrn: connection.platformUserId,
        mediaType,
        // YouTube-specific
        ...(videoBuffer ? { videoBuffer, isShort: true } : {}),
        ...(platformEnum === 'YOUTUBE' ? {
          title: youtubeTitle,
          tags: post.tags?.length ? post.tags : [],
        } : {}),
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
