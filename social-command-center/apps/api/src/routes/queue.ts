import { Router } from 'express';
import { publishQueue, mediaProcessQueue, metricsQueue, schedulerQueue } from '../queue/queues.js';

export const queueRouter = Router();

async function getQueueStats(queue: typeof publishQueue) {
  const [active, waiting, completed, failed, delayed] = await Promise.all([
    queue.getActiveCount(),
    queue.getWaitingCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);
  return { active, waiting, completed, failed, delayed };
}

// Queue health status
queueRouter.get('/status', async (_req, res) => {
  try {
    const [publish, mediaProcess, metrics, scheduler] = await Promise.all([
      getQueueStats(publishQueue),
      getQueueStats(mediaProcessQueue),
      getQueueStats(metricsQueue),
      getQueueStats(schedulerQueue),
    ]);

    res.json({ data: { publish, mediaProcess, metrics, scheduler } });
  } catch (error) {
    console.error('Failed to get queue status:', error);
    res.status(500).json({ error: 'Failed to get queue status' });
  }
});

// Get jobs for a specific post
queueRouter.get('/jobs/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const jobs = await publishQueue.getJobs(['active', 'waiting', 'delayed', 'completed', 'failed']);
    const postJobs = jobs
      .filter((j) => j.data?.postId === postId)
      .map((j) => ({
        id: j.id,
        name: j.name,
        platform: j.data?.platform,
        state: j.finishedOn ? (j.failedReason ? 'failed' : 'completed') : 'pending',
        attempts: j.attemptsMade,
        failedReason: j.failedReason || null,
        processedOn: j.processedOn ? new Date(j.processedOn).toISOString() : null,
        finishedOn: j.finishedOn ? new Date(j.finishedOn).toISOString() : null,
      }));

    res.json({ data: postJobs });
  } catch (error) {
    console.error('Failed to get jobs:', error);
    res.status(500).json({ error: 'Failed to get jobs' });
  }
});
