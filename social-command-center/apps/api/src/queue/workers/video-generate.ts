import { Worker, type Job } from 'bullmq';
import { bullMQConnection } from '../connection.js';
import type { VideoGenerateJobData } from '../queues.js';
import { generateVideo } from '../../services/video-generator.js';
import { emitVideoGenerated, emitVideoFailed } from '../../services/event-emitter.js';

/**
 * Video generation worker — calls Replicate to generate video,
 * uploads to storage, and emits Socket.io event with result.
 */
export const videoGenerateWorker = new Worker<VideoGenerateJobData>(
  'video-generate',
  async (job: Job<VideoGenerateJobData>) => {
    const { prompt, sourceImageUrl, duration, aspectRatio, userId, jobId } = job.data;

    console.log(`[Video] Processing job ${jobId}: ${duration}s ${aspectRatio} video`);

    try {
      const result = await generateVideo(
        { prompt, sourceImageUrl, duration, aspectRatio },
        userId,
      );

      console.log(`[Video] Job ${jobId} completed: ${result.videoUrl}`);
      emitVideoGenerated(userId, jobId, result);

      return result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Video] Job ${jobId} failed:`, errMsg);
      emitVideoFailed(userId, jobId, errMsg);
      throw error;
    }
  },
  {
    ...bullMQConnection,
    concurrency: 2,
  },
);

videoGenerateWorker.on('failed', (job, error) => {
  console.error(`[Video] Worker failed for job ${job?.data?.jobId}:`, error.message);
});
