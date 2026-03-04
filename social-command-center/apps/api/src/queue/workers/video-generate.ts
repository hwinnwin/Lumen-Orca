import { Worker, type Job } from 'bullmq';
import { bullMQConnection } from '../connection.js';
import type { VideoGenerateJobData } from '../queues.js';
import { generateVideo, generateMultiSegmentVideo } from '../../services/video-generator.js';
import { emitVideoGenerated, emitVideoFailed } from '../../services/event-emitter.js';
import { addCredits, calculateVideoCost, CREDIT_COSTS } from '../../services/credits.js';

/**
 * Video generation worker — handles both single-segment and multi-segment videos.
 * Single segment: calls Replicate directly (backwards compatible).
 * Multi-segment: generates each segment, generates audio, stitches with ffmpeg.
 */
export const videoGenerateWorker = new Worker<VideoGenerateJobData>(
  'video-generate',
  async (job: Job<VideoGenerateJobData>) => {
    const { prompt, sourceImageUrl, duration, aspectRatio, userId, jobId, segments, voiceoverScript, musicStyle } = job.data;

    const isMultiSegment = segments && segments.length > 1;
    const hasAudio = !!voiceoverScript || !!musicStyle;

    console.log(`[Video] Processing job ${jobId}: ${isMultiSegment ? `${segments!.length}-segment` : `${duration}s`} ${aspectRatio} video${hasAudio ? ' + audio' : ''}`);

    try {
      let result;

      if (isMultiSegment || hasAudio) {
        // Multi-segment or audio-enhanced video
        const effectiveSegments = segments && segments.length > 0
          ? segments
          : [{ segmentNumber: 1, prompt, duration }];

        result = await generateMultiSegmentVideo(
          { segments: effectiveSegments, aspectRatio, voiceoverScript, musicStyle },
          userId,
        );
      } else {
        // Legacy single-segment video (no audio)
        result = await generateVideo(
          { prompt, sourceImageUrl, duration, aspectRatio },
          userId,
        );
      }

      console.log(`[Video] Job ${jobId} completed: ${result.videoUrl}`);
      emitVideoGenerated(userId, jobId, result);

      return result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Video] Job ${jobId} failed:`, errMsg);

      // Refund credits on failure (credits were deducted upfront at enqueue time)
      try {
        const isMultiSeg = segments && segments.length > 1;
        const refundAmount = isMultiSeg || hasAudio
          ? calculateVideoCost({
              totalDuration: job.data.totalDuration ?? duration,
              hasMusic: !!musicStyle,
              hasVoiceover: !!voiceoverScript,
            })
          : CREDIT_COSTS.VIDEO_SEGMENT;

        await addCredits(userId, refundAmount, 'REFUND', `Refund: video job ${jobId} failed — ${errMsg.slice(0, 100)}`, { jobId });
        console.log(`[Video] Refunded ${refundAmount} credits to user ${userId} for failed job ${jobId}`);
      } catch (refundErr) {
        console.error(`[Video] Failed to refund credits for job ${jobId}:`, refundErr);
      }

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
