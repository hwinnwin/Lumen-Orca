import { Worker, type Job } from 'bullmq';
import { bullMQConnection } from '../connection.js';
import type { MediaProcessJobData } from '../queues.js';
import { prisma } from '../../db/client.js';
import type { Prisma } from '@prisma/client';
import { getObjectUrl, getVariantKey, uploadBuffer, s3Client, isS3Configured, readFromLocalStorage } from '../../services/s3.js';
import { GetObjectCommand } from '@aws-sdk/client-s3';

// Aspect ratio dimensions for image variants
const ASPECT_RATIOS = {
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  '9:16': { width: 1080, height: 1920 },
  '16:9': { width: 1920, height: 1080 },
} as const;

/**
 * Media processing worker — creates image variants and processes video.
 */
export const mediaProcessWorker = new Worker<MediaProcessJobData>(
  'process-media',
  async (job: Job<MediaProcessJobData>) => {
    const { mediaId } = job.data;

    const media = await prisma.mediaAsset.findUnique({ where: { id: mediaId } });
    if (!media) {
      console.warn(`[Media] Asset ${mediaId} not found, skipping`);
      return;
    }

    console.log(`[Media] Processing ${media.type}: ${media.originalKey}`);

    try {
      if (media.type === 'IMAGE') {
        await processImage(media.id, media.originalKey, media.mimeType);
      } else if (media.type === 'VIDEO') {
        await processVideo(media.id, media.originalKey, media.mimeType);
      }

      await prisma.mediaAsset.update({
        where: { id: mediaId },
        data: { status: 'READY' },
      });

      console.log(`[Media] Finished processing ${mediaId}`);
    } catch (error) {
      console.error(`[Media] Failed to process ${mediaId}:`, error);

      await prisma.mediaAsset.update({
        where: { id: mediaId },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  },
  {
    ...bullMQConnection,
    concurrency: 2,
  },
);

async function processImage(mediaId: string, originalKey: string, mimeType: string) {
  // Dynamically import sharp (ESM-only in newer versions)
  const sharp = (await import('sharp')).default;

  // Download original from storage (S3 or local filesystem)
  let originalBuffer: Buffer;

  if (isS3Configured) {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET || '',
        Key: originalKey,
      }),
    );
    const chunks: Buffer[] = [];
    const stream = response.Body as NodeJS.ReadableStream;
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    originalBuffer = Buffer.concat(chunks);
  } else {
    const localBuffer = await readFromLocalStorage(originalKey);
    if (!localBuffer) {
      throw new Error(`Local file not found for key: ${originalKey}`);
    }
    originalBuffer = localBuffer;
  }

  // Get original dimensions
  const metadata = await sharp(originalBuffer).metadata();
  const variants: Record<string, { url: string; width: number; height: number }> = {};

  // Generate each aspect ratio variant
  for (const [ratio, dims] of Object.entries(ASPECT_RATIOS)) {
    const variantKey = getVariantKey(originalKey, ratio.replace(':', 'x'), '.jpg');

    const variantBuffer = await sharp(originalBuffer)
      .resize(dims.width, dims.height, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 85 })
      .toBuffer();

    const url = await uploadBuffer(variantKey, variantBuffer, 'image/jpeg');
    variants[ratio] = { url, width: dims.width, height: dims.height };

    console.log(`[Media] Created ${ratio} variant: ${variantKey}`);
  }

  // Update media record with variants and dimensions
  await prisma.mediaAsset.update({
    where: { id: mediaId },
    data: {
      width: metadata.width || null,
      height: metadata.height || null,
      originalUrl: getObjectUrl(originalKey),
      variants: variants as unknown as Prisma.InputJsonValue,
    },
  });
}

async function processVideo(mediaId: string, originalKey: string, _mimeType: string) {
  console.log(`[Media] Video processing for ${mediaId} — setting URL`);

  const url = getObjectUrl(originalKey);
  await prisma.mediaAsset.update({
    where: { id: mediaId },
    data: {
      originalUrl: url,
      variants: {
        original: { url },
      },
    },
  });
}

mediaProcessWorker.on('failed', (job, error) => {
  console.error(`[Media] Worker failed for ${job?.data?.mediaId}:`, error.message);
});
