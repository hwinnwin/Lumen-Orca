import { Worker, type Job } from 'bullmq';
import { bullMQConnection } from '../connection.js';
import type { VideoExportJobData } from '../queues.js';
import { exportEditedVideo } from '../../services/video-generator.js';
import { emitVideoExported, emitVideoExportFailed } from '../../services/event-emitter.js';
import { addCredits, CREDIT_COSTS } from '../../services/credits.js';

/**
 * Video export worker — downloads user clips, trims/concatenates via FFmpeg,
 * mixes audio, uploads result. Refunds credits on failure.
 */
export const videoExportWorker = new Worker<VideoExportJobData>(
  'video-export',
  async (job: Job<VideoExportJobData>) => {
    const { clips, audioStorageKey, audioVolume, userId, jobId } = job.data;

    console.log(`[VideoExport] Processing job ${jobId}: ${clips.length} clips${audioStorageKey ? ' + audio' : ''}`);

    try {
      const result = await exportEditedVideo(clips, audioStorageKey, audioVolume, userId);

      console.log(`[VideoExport] Job ${jobId} completed: ${result.videoUrl}`);
      emitVideoExported(userId, jobId, result);

      return result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error(`[VideoExport] Job ${jobId} failed:`, errMsg);

      // Refund credits on failure
      try {
        await addCredits(
          userId,
          CREDIT_COSTS.VIDEO_EXPORT,
          'REFUND',
          `Refund: video export job ${jobId} failed — ${errMsg.slice(0, 100)}`,
          { jobId },
        );
        console.log(`[VideoExport] Refunded ${CREDIT_COSTS.VIDEO_EXPORT} credits to user ${userId}`);
      } catch (refundErr) {
        console.error(`[VideoExport] Failed to refund credits for job ${jobId}:`, refundErr);
      }

      emitVideoExportFailed(userId, jobId, errMsg);
      throw error;
    }
  },
  {
    ...bullMQConnection,
    concurrency: 2,
  },
);

videoExportWorker.on('failed', (job, error) => {
  console.error(`[VideoExport] Worker failed for job ${job?.data?.jobId}:`, error.message);
});
