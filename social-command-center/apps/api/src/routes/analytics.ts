import { Router } from 'express';
import { prisma } from '../db/client.js';
import { getAdapter } from '../adapters/registry.js';
import { getUserPlatformConnection } from '../utils/token-manager.js';
import { ensureValidToken } from '../middleware/token-refresh.js';
import type { Platform, Prisma } from '@prisma/client';

export const analyticsRouter = Router();

interface PostMetrics {
  likes?: number;
  comments?: number;
  shares?: number;
  impressions?: number;
  [key: string]: unknown;
}

analyticsRouter.get('/', async (req, res) => {
  try {
    const range = Math.min(Math.max(parseInt(req.query.range as string) || 30, 1), 365);
    const userId = req.userId;
    const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000);

    const postWhere: Prisma.PostWhereInput = { userId, createdAt: { gte: since } };

    // ── Overview counts ────────────────────────────────────
    const [totalPosts, publishedCount, draftCount, failedCount] = await Promise.all([
      prisma.post.count({ where: postWhere }),
      prisma.post.count({ where: { ...postWhere, status: { in: ['PUBLISHED', 'PARTIAL_FAILURE'] } } }),
      prisma.post.count({ where: { ...postWhere, status: 'DRAFT' } }),
      prisma.post.count({ where: { ...postWhere, status: 'FAILED' } }),
    ]);

    // ── Publish results for this user in range ─────────────
    const publishResults = await prisma.publishResult.findMany({
      where: {
        post: { userId, createdAt: { gte: since } },
      },
      select: {
        platform: true,
        status: true,
        metrics: true,
        metricsFetchedAt: true,
      },
    });

    const successResults = publishResults.filter((r) => r.status === 'SUCCESS');
    const failedResults = publishResults.filter((r) => r.status === 'FAILED');
    const successRate = publishResults.length > 0
      ? Math.round((successResults.length / publishResults.length) * 100)
      : 0;

    // ── Metrics freshness ────────────────────────────────
    const withMetrics = successResults.filter((r) => r.metricsFetchedAt);
    const latestFetch = withMetrics.length > 0
      ? new Date(Math.max(...withMetrics.map((r) => r.metricsFetchedAt!.getTime()))).toISOString()
      : null;
    const unfetchedCount = successResults.length - withMetrics.length;

    // ── Aggregate engagement from metrics JSON ─────────────
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalImpressions = 0;

    for (const r of successResults) {
      const m = r.metrics as PostMetrics | null;
      if (m) {
        totalLikes += (m.likes as number) || 0;
        totalComments += (m.comments as number) || 0;
        totalShares += (m.shares as number) || 0;
        totalImpressions += (m.impressions as number) || 0;
      }
    }

    const totalEngagements = totalLikes + totalComments + totalShares;
    const engagementRate = totalImpressions > 0
      ? parseFloat(((totalEngagements / totalImpressions) * 100).toFixed(1))
      : 0;

    // ── Platform breakdown ─────────────────────────────────
    const platformMap = new Map<string, {
      published: number; failed: number;
      likes: number; comments: number; shares: number; impressions: number;
    }>();

    for (const r of publishResults) {
      const entry = platformMap.get(r.platform) || {
        published: 0, failed: 0, likes: 0, comments: 0, shares: 0, impressions: 0,
      };
      if (r.status === 'SUCCESS') {
        entry.published++;
        const m = r.metrics as PostMetrics | null;
        if (m) {
          entry.likes += (m.likes as number) || 0;
          entry.comments += (m.comments as number) || 0;
          entry.shares += (m.shares as number) || 0;
          entry.impressions += (m.impressions as number) || 0;
        }
      } else if (r.status === 'FAILED') {
        entry.failed++;
      }
      platformMap.set(r.platform, entry);
    }

    const platformBreakdown = Array.from(platformMap.entries()).map(([platform, stats]) => ({
      platform,
      ...stats,
    }));

    const activePlatforms = platformBreakdown.filter((p) => p.published > 0).length;

    // ── Daily activity (raw SQL for DATE_TRUNC) ────────────
    const dailyRows = await prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
      SELECT DATE_TRUNC('day', "createdAt") AS day, COUNT(*)::bigint AS count
      FROM "Post"
      WHERE "userId" = ${userId} AND "createdAt" >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `;

    // Fill in all days in the range
    const dailyActivity: Array<{ date: string; posts: number }> = [];
    const dayMs = 24 * 60 * 60 * 1000;
    const dayMap = new Map(dailyRows.map((r) => [
      new Date(r.day).toISOString().slice(0, 10),
      Number(r.count),
    ]));
    for (let t = since.getTime(); t < Date.now(); t += dayMs) {
      const dateStr = new Date(t).toISOString().slice(0, 10);
      dailyActivity.push({ date: dateStr, posts: dayMap.get(dateStr) || 0 });
    }

    // ── Recent published posts with metrics ────────────────
    const recentPublished = await prisma.post.findMany({
      where: { userId, status: { in: ['PUBLISHED', 'PARTIAL_FAILURE'] }, createdAt: { gte: since } },
      include: {
        publishResults: {
          select: { platform: true, status: true, platformUrl: true, metrics: true, publishedAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // ── Top posts by engagement ────────────────────────────
    const publishedPosts = await prisma.post.findMany({
      where: { userId, status: { in: ['PUBLISHED', 'PARTIAL_FAILURE'] }, createdAt: { gte: since } },
      include: {
        publishResults: {
          where: { status: 'SUCCESS' },
          select: { platform: true, metrics: true },
        },
      },
    });

    const topPosts = publishedPosts
      .map((post) => {
        let eng = 0;
        let topPlatform = '';
        let topEng = 0;
        for (const r of post.publishResults) {
          const m = r.metrics as PostMetrics | null;
          const e = ((m?.likes as number) || 0) + ((m?.comments as number) || 0) + ((m?.shares as number) || 0);
          eng += e;
          if (e > topEng) {
            topEng = e;
            topPlatform = r.platform;
          }
        }
        return { id: post.id, content: post.content, platforms: post.platforms, totalEngagement: eng, topPlatform };
      })
      .sort((a, b) => b.totalEngagement - a.totalEngagement)
      .slice(0, 5);

    res.json({
      data: {
        overview: {
          totalPosts,
          publishedCount,
          draftCount,
          failedCount,
          successRate,
          activePlatforms,
        },
        engagement: {
          totalImpressions,
          totalLikes,
          totalComments,
          totalShares,
          engagementRate,
        },
        dailyActivity,
        platformBreakdown,
        recentPublished: recentPublished.map((p) => ({
          id: p.id,
          content: p.content.slice(0, 200),
          platforms: p.platforms,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
          publishResults: p.publishResults.map((r) => ({
            platform: r.platform,
            status: r.status,
            platformUrl: r.platformUrl,
            metrics: r.metrics,
            publishedAt: r.publishedAt?.toISOString() || null,
          })),
        })),
        topPosts,
        metricsFreshness: {
          lastFetchedAt: latestFetch,
          unfetchedCount,
          totalPublished: successResults.length,
        },
      },
    });
  } catch (error) {
    console.error('[Analytics] Failed:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

// ── Refresh metrics for all published posts (fetches immediately) ──
analyticsRouter.post('/refresh-metrics', async (req, res) => {
  try {
    const userId = req.userId;

    // Find all publish results with SUCCESS status for this user
    const results = await prisma.publishResult.findMany({
      where: {
        status: 'SUCCESS',
        platformPostId: { not: null },
        post: { userId },
      },
      select: {
        id: true,
        platform: true,
        platformPostId: true,
      },
    });

    if (results.length === 0) {
      return res.json({ data: { refreshed: 0, failed: 0, message: 'No published posts to refresh' } });
    }

    // Fetch metrics directly from each platform API — no queue delay
    let refreshed = 0;
    let failed = 0;

    for (const r of results) {
      if (!r.platformPostId) continue;
      try {
        const platformEnum = r.platform as Platform;
        const connection = await getUserPlatformConnection(userId, platformEnum);
        if (!connection || !connection.isActive) {
          console.warn(`[Analytics] No active ${r.platform} connection, skipping metrics for ${r.platformPostId}`);
          failed++;
          continue;
        }

        const accessToken = await ensureValidToken(connection);
        const adapter = getAdapter(platformEnum);
        const metrics = await adapter.getMetrics(r.platformPostId, accessToken);
        console.log(`[Analytics] ${r.platform} metrics for ${r.platformPostId}:`, JSON.stringify(metrics));

        await prisma.publishResult.update({
          where: { id: r.id },
          data: {
            metrics: metrics as unknown as Prisma.InputJsonValue,
            metricsFetchedAt: new Date(),
          },
        });

        refreshed++;
      } catch (err: any) {
        console.error(`[Analytics] Failed to fetch ${r.platform} metrics for ${r.platformPostId}:`, err.message);
        failed++;
      }
    }

    console.log(`[Analytics] Refresh complete: ${refreshed} updated, ${failed} failed`);
    res.json({
      data: {
        refreshed,
        failed,
        message: `Updated metrics for ${refreshed} post(s)${failed > 0 ? `, ${failed} failed` : ''}.`,
      },
    });
  } catch (error) {
    console.error('[Analytics] Refresh metrics failed:', error);
    res.status(500).json({ error: 'Failed to refresh metrics' });
  }
});
