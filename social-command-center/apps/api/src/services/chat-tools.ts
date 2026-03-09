import { prisma } from '../db/client.js';
import { enqueuePublishJobs } from './publish-service.js';
import type { Platform, Prisma } from '@prisma/client';
import type Anthropic from '@anthropic-ai/sdk';

// ─── Valid Platforms ────────────────────────────────────

const VALID_PLATFORMS: Platform[] = [
  'FACEBOOK',
  'INSTAGRAM',
  'LINKEDIN',
  'X',
  'TIKTOK',
  'YOUTUBE',
];

// ─── Tool Definitions (Anthropic format) ────────────────

export const CHAT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'create_post',
    description:
      'Create a social media post. Use this when the user asks you to create, draft, or publish a post to one or more platforms. By default create as DRAFT unless the user explicitly says to publish immediately (e.g. "post it now", "publish it", "go ahead").',
    input_schema: {
      type: 'object' as const,
      properties: {
        content: {
          type: 'string',
          description: 'The post content/caption text',
        },
        platforms: {
          type: 'array',
          items: {
            type: 'string',
            enum: VALID_PLATFORMS,
          },
          description: 'Target platform(s) to post to',
        },
        schedule_type: {
          type: 'string',
          enum: ['IMMEDIATE', 'DRAFT'],
          description:
            'IMMEDIATE publishes right away, DRAFT saves without publishing. Default to DRAFT.',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional tags for the post',
        },
      },
      required: ['content', 'platforms'],
    },
  },
  {
    name: 'list_connected_platforms',
    description:
      'List which social media platforms the user has connected to their account. Use this to check availability before creating a post.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_recent_posts',
    description:
      "Get the user's recent posts with their status, platforms, and content preview.",
    input_schema: {
      type: 'object' as const,
      properties: {
        limit: {
          type: 'number',
          description: 'Number of posts to return (1-10, default 5)',
        },
      },
    },
  },
];

// ─── Tool Name Mapping (for SSE status messages) ───────

export const TOOL_ACTION_LABELS: Record<string, string> = {
  create_post: 'Creating post...',
  list_connected_platforms: 'Checking platforms...',
  get_recent_posts: 'Fetching posts...',
};

// ─── Tool Execution ─────────────────────────────────────

export async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  userId: string,
): Promise<string> {
  switch (toolName) {
    case 'create_post':
      return executeCreatePost(toolInput, userId);
    case 'list_connected_platforms':
      return executeListPlatforms(userId);
    case 'get_recent_posts':
      return executeGetRecentPosts(toolInput, userId);
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

// ─── Tool Implementations ───────────────────────────────

async function executeCreatePost(
  input: Record<string, unknown>,
  userId: string,
): Promise<string> {
  const content = input.content as string;
  const platforms = input.platforms as string[];
  const scheduleType = (input.schedule_type as string) || 'DRAFT';
  const tags = (input.tags as string[]) || [];

  if (!content?.trim()) {
    return JSON.stringify({ error: 'Post content cannot be empty' });
  }
  if (!platforms?.length) {
    return JSON.stringify({ error: 'At least one platform is required' });
  }

  // Validate platforms are valid enum values
  const validPlatforms = platforms.filter((p) =>
    VALID_PLATFORMS.includes(p as Platform),
  ) as Platform[];

  if (validPlatforms.length === 0) {
    return JSON.stringify({
      error: `Invalid platforms: ${platforms.join(', ')}. Valid: ${VALID_PLATFORMS.join(', ')}`,
    });
  }

  // Check which platforms are connected
  const connections = await prisma.platformConnection.findMany({
    where: { userId, isActive: true, platform: { in: validPlatforms } },
    select: { platform: true },
  });

  const connectedSet = new Set(connections.map((c) => c.platform));
  const unconnected = validPlatforms.filter((p) => !connectedSet.has(p));

  if (unconnected.length > 0 && scheduleType === 'IMMEDIATE') {
    return JSON.stringify({
      error: `Cannot publish — these platforms are not connected: ${unconnected.join(', ')}. Please ask the user to connect them in Settings first.`,
      connected: connections.map((c) => c.platform),
    });
  }

  // Create the post
  const isImmediate = scheduleType === 'IMMEDIATE';

  const post = await prisma.post.create({
    data: {
      userId,
      content: content.trim(),
      platforms: validPlatforms,
      scheduleType: 'IMMEDIATE',
      status: isImmediate ? 'QUEUED' : 'DRAFT',
      tags,
      timezone: 'UTC',
    },
  });

  // Enqueue publish jobs if immediate
  if (isImmediate) {
    const fullPost = await prisma.post.findUnique({ where: { id: post.id } });
    if (fullPost) {
      await enqueuePublishJobs(fullPost);
    }
  }

  const platformNames = validPlatforms.join(', ');
  if (isImmediate) {
    return JSON.stringify({
      success: true,
      postId: post.id,
      status: 'QUEUED',
      platforms: validPlatforms,
      message: `Post created and queued for publishing to ${platformNames}. It will be published shortly.`,
      ...(unconnected.length > 0
        ? {
            warning: `Note: ${unconnected.join(', ')} are not connected, so the post was only queued for connected platforms.`,
          }
        : {}),
    });
  }

  return JSON.stringify({
    success: true,
    postId: post.id,
    status: 'DRAFT',
    platforms: validPlatforms,
    message: `Post saved as draft for ${platformNames}. The user can publish it from the Compose page or ask you to publish it now.`,
  });
}

async function executeListPlatforms(userId: string): Promise<string> {
  const connections = await prisma.platformConnection.findMany({
    where: { userId, isActive: true },
    select: { platform: true, platformName: true },
  });

  if (connections.length === 0) {
    return JSON.stringify({
      platforms: [],
      message:
        'No platforms connected. The user needs to connect platforms in Settings → Connections.',
    });
  }

  return JSON.stringify({
    platforms: connections.map((c) => ({
      platform: c.platform,
      name: c.platformName || c.platform,
    })),
    message: `${connections.length} platform(s) connected: ${connections.map((c) => c.platformName || c.platform).join(', ')}`,
  });
}

async function executeGetRecentPosts(
  input: Record<string, unknown>,
  userId: string,
): Promise<string> {
  const limit = Math.min(Math.max((input.limit as number) || 5, 1), 10);

  const posts = await prisma.post.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      content: true,
      platforms: true,
      status: true,
      createdAt: true,
      tags: true,
    },
  });

  if (posts.length === 0) {
    return JSON.stringify({
      posts: [],
      message: 'No posts found.',
    });
  }

  return JSON.stringify({
    posts: posts.map((p) => ({
      id: p.id,
      content: p.content.slice(0, 150) + (p.content.length > 150 ? '...' : ''),
      platforms: p.platforms,
      status: p.status,
      tags: p.tags,
      createdAt: p.createdAt.toISOString(),
    })),
    total: posts.length,
  });
}
