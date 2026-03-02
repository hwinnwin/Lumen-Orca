import { Router } from 'express';
import { prisma } from '../db/client.js';
import {
  generateMediaKey,
  getPresignedUploadUrl,
  deleteObject,
  isS3Configured,
  saveToLocalStorage,
  readFromLocalStorage,
} from '../services/s3.js';
import { mediaProcessQueue } from '../queue/queues.js';
import { validateMedia } from '../utils/media-validator.js';
import type { Platform } from '@prisma/client';
import multer from 'multer';
import mime from 'mime-types';

export const mediaRouter = Router();

// Multer for local file uploads (memory storage)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

// Request a presigned upload URL (or local upload URL when S3 is not configured)
mediaRouter.post('/upload-url', async (req, res) => {
  try {
    const { filename, contentType, fileSize, platforms } = req.body as {
      filename: string;
      contentType: string;
      fileSize: number;
      platforms?: string[];
    };

    if (!filename || !contentType || !fileSize) {
      return res.status(400).json({ error: 'filename, contentType, and fileSize are required' });
    }

    // Validate media against target platforms
    if (platforms?.length) {
      for (const platform of platforms) {
        const errors = validateMedia(platform as Platform, contentType, fileSize);
        if (errors.length > 0) {
          return res.status(400).json({
            error: `Media validation failed for ${platform}`,
            details: errors,
          });
        }
      }
    }

    // Determine media type
    let type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' = 'IMAGE';
    if (contentType.startsWith('video/')) type = 'VIDEO';
    else if (contentType.startsWith('application/')) type = 'DOCUMENT';

    const key = generateMediaKey(req.userId, filename);

    // Create media record
    const media = await prisma.mediaAsset.create({
      data: {
        userId: req.userId,
        originalUrl: '',
        originalKey: key,
        type,
        mimeType: contentType,
        fileSize,
        status: 'UPLOADING',
      },
    });

    // Generate presigned S3 upload URL (or local upload URL)
    const { url } = await getPresignedUploadUrl(key, contentType, fileSize);

    res.status(201).json({
      data: {
        mediaId: media.id,
        key,
        uploadUrl: url,
        local: !isS3Configured,
      },
    });
  } catch (error) {
    console.error('Failed to generate upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// Local file upload endpoint (used when S3 is not configured)
mediaRouter.put('/local-upload/:key', upload.single('file'), async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key as string);
    let buffer: Buffer;

    if (req.file) {
      // multipart/form-data upload
      buffer = req.file.buffer;
    } else {
      // Raw binary upload (like S3 presigned URL PUT)
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.from(chunk));
      }
      buffer = Buffer.concat(chunks);
    }

    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ error: 'No file data received' });
    }

    const url = await saveToLocalStorage(key, buffer);

    // Update the media record with the URL
    await prisma.mediaAsset.updateMany({
      where: { originalKey: key },
      data: { originalUrl: url },
    });

    res.json({ data: { url, key } });
  } catch (error) {
    console.error('Failed to upload locally:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Serve locally stored media files
mediaRouter.get('/local/:key', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const buffer = await readFromLocalStorage(key);

    if (!buffer) {
      return res.status(404).json({ error: 'File not found' });
    }

    const contentType = mime.lookup(key) || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (error) {
    console.error('Failed to serve local file:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// Confirm upload complete — triggers media processing
mediaRouter.post('/:id/confirm', async (req, res) => {
  try {
    const media = await prisma.mediaAsset.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!media) {
      return res.status(404).json({ error: 'Media asset not found' });
    }

    const updated = await prisma.mediaAsset.update({
      where: { id: req.params.id },
      data: { status: 'PROCESSING' },
    });

    // Enqueue media processing job
    await mediaProcessQueue.add(
      `process-${media.type.toLowerCase()}-${media.id}`,
      { mediaId: media.id, userId: req.userId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10_000 },
      },
    );

    res.json({ data: updated });
  } catch (error) {
    console.error('Failed to confirm upload:', error);
    res.status(500).json({ error: 'Failed to confirm upload' });
  }
});

// List media for the authenticated user
mediaRouter.get('/', async (req, res) => {
  try {
    const media = await prisma.mediaAsset.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ data: media });
  } catch (error) {
    console.error('Failed to list media:', error);
    res.status(500).json({ error: 'Failed to list media' });
  }
});

// Delete a media asset
mediaRouter.delete('/:id', async (req, res) => {
  try {
    const media = await prisma.mediaAsset.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!media) {
      return res.status(404).json({ error: 'Media asset not found' });
    }

    // Delete from storage
    if (media.originalKey) {
      try {
        await deleteObject(media.originalKey);
      } catch (e) {
        console.warn(`[Media] Failed to delete object ${media.originalKey}:`, e);
      }
    }

    await prisma.mediaAsset.delete({ where: { id: req.params.id } });
    res.json({ data: { success: true } });
  } catch (error) {
    console.error('Failed to delete media:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
});
