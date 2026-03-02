import { Worker, type Job } from 'bullmq';
import { bullMQConnection } from '../connection.js';
import type { MetricsJobData } from '../queues.js';
import { prisma } from '../../db/client.js';
import { getAdapter } from '../../adapters/registry.js';
import { getUserPlatformConnection } from '../../utils/token-manager.js';
import { ensureValidToken } from '../../middleware/token-refresh.js';
import type { Platform, Prisma } from '@prisma/client';

/**
 * Metrics worker — fetches engagement metrics for published posts.
 */
export const metricsWorker = new Worker<MetricsJobData>(
  'fetch-metrics',
  async (job: Job<MetricsJobData>) => {
    const { publishResultId, platformPostId, platform, userId } = job.data;
    const platformEnum = platform as Platform;

    console.log(`[Metrics] Fetching ${platform} metrics for ${platformPostId}`);

    const connection = await getUserPlatformConnection(userId, platformEnum);
    if (!connection || !connection.isActive) {
      console.warn(`[Metrics] No active connection for ${platform}, skipping`);
      return;
    }

    const accessToken = await ensureValidToken(connection);
    const adapter = getAdapter(platformEnum);
    const metrics = await adapter.getMetrics(platformPostId, accessToken);

    await prisma.publishResult.update({
      where: { id: publishResultId },
      data: {
        metrics: metrics as unknown as Prisma.InputJsonValue,
        metricsFetchedAt: new Date(),
      },
    });

    console.log(`[Metrics] Updated metrics for ${platform}: ${JSON.stringify(metrics)}`);
  },
  {
    ...bullMQConnection,
    concurrency: 3,
  },
);

metricsWorker.on('failed', (job, error) => {
  console.error(`[Metrics] Failed:`, error.message);
});
