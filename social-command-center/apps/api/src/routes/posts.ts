import { Router } from 'express';
import { prisma } from '../db/client.js';
import type { Platform, Prisma, ScheduleType } from '@prisma/client';
import { enqueuePublishJobs, publishNow, cancelScheduled, getPostStatus } from '../services/publish-service.js';

export const postsRouter = Router();

// Create a new post
postsRouter.post('/', async (req, res) => {
  try {
    const {
      content,
      platforms,
      platformOverrides,
      scheduleType,
      scheduledAt,
      timezone,
      tags,
      mediaAssetIds,
      aiEnhancement,
    } = req.body as {
      content: string;
      platforms: Platform[];
      platformOverrides?: Record<string, string>;
      scheduleType: ScheduleType;
      scheduledAt?: string;
      timezone?: string;
      tags?: string[];
      mediaAssetIds?: string[];
      aiEnhancement?: Record<string, unknown>;
    };

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }
    if (!platforms?.length) {
      return res.status(400).json({ error: 'At least one platform is required' });
    }

    const post = await prisma.post.create({
      data: {
        userId: req.userId,
        content: content.trim(),
        platforms,
        platformOverrides: (platformOverrides || undefined) as Prisma.InputJsonValue | undefined,
        scheduleType: scheduleType || 'IMMEDIATE',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        timezone: timezone || 'UTC',
        tags: tags || [],
        aiEnhancement: (aiEnhancement || undefined) as Prisma.InputJsonValue | undefined,
        status: scheduleType === 'IMMEDIATE' ? 'QUEUED' : 'DRAFT',
        mediaAttachments: mediaAssetIds?.length
          ? {
              create: mediaAssetIds.map((mediaId, i) => ({
                mediaId,
                position: i,
              })),
            }
          : undefined,
      },
      include: {
        publishResults: true,
        mediaAttachments: {
          include: { media: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    // If IMMEDIATE, enqueue publish jobs now
    if (scheduleType === 'IMMEDIATE' || !scheduleType) {
      await enqueuePublishJobs(post);
    }
    // If SCHEDULED, the scheduler worker will pick it up when scheduledAt passes

    res.status(201).json({ data: post });
  } catch (error) {
    console.error('Failed to create post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Bulk create posts (for campaign generator)
postsRouter.post('/bulk', async (req, res) => {
  try {
    const { requestId, posts: postInputs } = req.body as {
      requestId?: string;
      posts: Array<{
        content: string;
        platforms: Platform[];
        scheduleType: ScheduleType;
        scheduledAt?: string;
        tags?: string[];
      }>;
    };

    if (!postInputs?.length) {
      return res.status(400).json({ error: 'At least one post is required' });
    }
    if (postInputs.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 posts per bulk request' });
    }

    // Duplicate protection: if requestId provided, check for existing posts with this tag
    if (requestId) {
      const existing = await prisma.post.count({
        where: {
          userId: req.userId,
          tags: { has: `requestId:${requestId}` },
        },
      });
      if (existing > 0) {
        return res.status(409).json({
          error: 'Posts for this campaign have already been created',
          code: 'DUPLICATE_REQUEST',
          existingCount: existing,
        });
      }
    }

    const created: any[] = [];
    const failures: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < postInputs.length; i++) {
      const input = postInputs[i];
      try {
        if (!input.content?.trim()) {
          failures.push({ index: i, error: 'Content is required' });
          continue;
        }
        if (!input.platforms?.length) {
          failures.push({ index: i, error: 'At least one platform is required' });
          continue;
        }

        const tags = [...(input.tags || [])];
        if (requestId) tags.push(`requestId:${requestId}`);

        // Normalize platform names to uppercase enum values (AI returns lowercase)
        const normalizedPlatforms = input.platforms.map(
          (p: string) => p.toUpperCase() as Platform,
        );

        const post = await prisma.post.create({
          data: {
            userId: req.userId,
            content: input.content.trim(),
            platforms: normalizedPlatforms,
            scheduleType: input.scheduleType || 'DRAFT',
            scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
            tags,
            status: input.scheduleType === 'IMMEDIATE' ? 'QUEUED' : 'DRAFT',
          },
          include: { publishResults: true },
        });

        // Enqueue publish jobs if immediate
        if (input.scheduleType === 'IMMEDIATE') {
          await enqueuePublishJobs(post);
        }

        created.push(post);
      } catch (err: any) {
        failures.push({ index: i, error: err.message || 'Unknown error' });
      }
    }

    res.status(201).json({
      data: created,
      meta: { count: postInputs.length, succeeded: created.length, failed: failures.length },
      failures: failures.length > 0 ? failures : undefined,
    });
  } catch (error) {
    console.error('Failed to bulk create posts:', error);
    res.status(500).json({ error: 'Failed to bulk create posts' });
  }
});

// List posts for the authenticated user
postsRouter.get('/', async (req, res) => {
  try {
    const { status, page = '1', limit = '20' } = req.query as {
      status?: string;
      page?: string;
      limit?: string;
    };

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      userId: req.userId,
      ...(status ? { status: status as any } : {}),
    };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          publishResults: true,
          mediaAttachments: {
            include: { media: true },
            orderBy: { position: 'asc' as const },
          },
        },
        orderBy: { createdAt: 'desc' as const },
        skip,
        take: limitNum,
      }),
      prisma.post.count({ where }),
    ]);

    res.json({
      data: posts,
      meta: { page: pageNum, limit: limitNum, total },
    });
  } catch (error) {
    console.error('Failed to list posts:', error);
    res.status(500).json({ error: 'Failed to list posts' });
  }
});

// Get a single post
postsRouter.get('/:id', async (req, res) => {
  try {
    const post = await prisma.post.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        publishResults: true,
        mediaAttachments: {
          include: { media: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ data: post });
  } catch (error) {
    console.error('Failed to get post:', error);
    res.status(500).json({ error: 'Failed to get post' });
  }
});

// Update a post (only if draft or queued)
postsRouter.patch('/:id', async (req, res) => {
  try {
    const post = await prisma.post.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (!['DRAFT', 'QUEUED'].includes(post.status)) {
      return res.status(400).json({ error: 'Cannot edit a post that has been published or is publishing' });
    }

    const {
      content,
      platforms,
      platformOverrides,
      scheduleType,
      scheduledAt,
      timezone,
      tags,
      mediaAssetIds,
    } = req.body as {
      content?: string;
      platforms?: Platform[];
      platformOverrides?: Record<string, string>;
      scheduleType?: ScheduleType;
      scheduledAt?: string | null;
      timezone?: string;
      tags?: string[];
      mediaAssetIds?: string[];
    };

    // Build update data — only update fields that are provided
    const updateData: any = {};
    if (content !== undefined) updateData.content = content.trim();
    if (platforms !== undefined) updateData.platforms = platforms;
    if (platformOverrides !== undefined) updateData.platformOverrides = platformOverrides as Prisma.InputJsonValue;
    if (scheduleType !== undefined) {
      updateData.scheduleType = scheduleType;
      updateData.status = scheduleType === 'IMMEDIATE' ? 'QUEUED' : 'DRAFT';
    }
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (tags !== undefined) updateData.tags = tags;

    // Update media attachments if provided
    if (mediaAssetIds !== undefined) {
      // Remove existing attachments and re-create
      await prisma.postMedia.deleteMany({ where: { postId: post.id } });
      if (mediaAssetIds.length > 0) {
        await prisma.postMedia.createMany({
          data: mediaAssetIds.map((mediaId, i) => ({
            postId: post.id,
            mediaId,
            position: i,
          })),
        });
      }
    }

    const updated = await prisma.post.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        publishResults: true,
        mediaAttachments: {
          include: { media: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    res.json({ data: updated });
  } catch (error) {
    console.error('Failed to update post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete a post (only if draft or scheduled)
postsRouter.delete('/:id', async (req, res) => {
  try {
    const post = await prisma.post.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (!['DRAFT', 'QUEUED'].includes(post.status)) {
      return res.status(400).json({ error: 'Cannot delete a post that has been published or is publishing' });
    }

    await prisma.post.delete({ where: { id: req.params.id } });
    res.json({ data: { success: true } });
  } catch (error) {
    console.error('Failed to delete post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Force publish a draft post
postsRouter.post('/:id/publish', async (req, res) => {
  try {
    const updated = await publishNow(req.params.id, req.userId);
    res.json({ data: updated });
  } catch (error: any) {
    if (error.message === 'Post not found') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Failed to publish post:', error);
    res.status(500).json({ error: error.message || 'Failed to publish post' });
  }
});

// Cancel a scheduled post
postsRouter.post('/:id/cancel', async (req, res) => {
  try {
    const post = await cancelScheduled(req.params.id, req.userId);
    res.json({ data: post });
  } catch (error: any) {
    if (error.message === 'Post not found') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Failed to cancel post:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel post' });
  }
});

// Get detailed publish status for a post
postsRouter.get('/:id/status', async (req, res) => {
  try {
    const status = await getPostStatus(req.params.id, req.userId);
    res.json({ data: status });
  } catch (error: any) {
    if (error.message === 'Post not found') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Failed to get post status:', error);
    res.status(500).json({ error: 'Failed to get post status' });
  }
});
