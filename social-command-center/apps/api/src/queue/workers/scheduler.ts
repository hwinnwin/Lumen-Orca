import { Worker } from 'bullmq';
import { bullMQConnection } from '../connection.js';
import { publishQueue } from '../queues.js';
import { prisma } from '../../db/client.js';

/**
 * Scheduler worker — runs every 60 seconds.
 * Finds posts whose scheduledAt time has passed and enqueues publish jobs.
 */
export const schedulerWorker = new Worker(
  'post-scheduler',
  async () => {
    const now = new Date();

    // Find scheduled posts that are ready to publish
    const readyPosts = await prisma.post.findMany({
      where: {
        status: 'DRAFT',
        scheduleType: 'SCHEDULED',
        scheduledAt: { lte: now },
      },
      include: {
        user: true,
      },
    });

    if (readyPosts.length === 0) return;

    console.log(`[Scheduler] Found ${readyPosts.length} posts ready to publish`);

    for (const post of readyPosts) {
      // Update status to QUEUED
      await prisma.post.update({
        where: { id: post.id },
        data: { status: 'QUEUED' },
      });

      // Enqueue a publish job for each platform
      for (const platform of post.platforms) {
        await publishQueue.add(
          `publish-${post.id}-${platform}`,
          {
            postId: post.id,
            platform,
            userId: post.userId,
          },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 30000, // 30s, then 60s, then 120s
            },
            removeOnComplete: { count: 1000 },
            removeOnFail: { count: 5000 },
          },
        );
      }

      console.log(`[Scheduler] Enqueued ${post.platforms.length} publish jobs for post ${post.id}`);
    }
  },
  bullMQConnection,
);

// Set up the scheduler as a repeatable job
export async function startScheduler(): Promise<void> {
  const { schedulerQueue: queue } = await import('../queues.js');

  await queue.add(
    'check-scheduled-posts',
    {},
    {
      repeat: {
        every: 60000, // Every 60 seconds
      },
    },
  );

  console.log('[Scheduler] Started — checking every 60 seconds');
}

schedulerWorker.on('failed', (_job, error) => {
  console.error('[Scheduler] Failed:', error.message);
});
