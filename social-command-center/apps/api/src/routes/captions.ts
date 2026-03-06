import { Router } from 'express';
import { prisma } from '../db/client.js';
import { isWhisperConfigured, transcribeWithWhisper, generateSrtFromText, burnCaptionsIntoVideo } from '../services/caption-generator.js';
import { isS3Configured, readFromLocalStorage } from '../services/s3.js';

export const captionsRouter = Router();

/**
 * GET /api/captions/status — Check if Whisper transcription is available
 */
captionsRouter.get('/status', (_req, res) => {
  res.json({
    whisperAvailable: isWhisperConfigured(),
    fallbackAvailable: true, // Script-based SRT is always available
  });
});

/**
 * POST /api/captions/transcribe — Transcribe a media asset using Whisper
 * Body: { mediaAssetId: string, language?: string, prompt?: string }
 */
captionsRouter.post('/transcribe', async (req, res) => {
  try {
    if (!isWhisperConfigured()) {
      return res.status(400).json({
        error: 'Whisper transcription is not configured. Set OPENAI_API_KEY in your environment.',
      });
    }

    const { mediaAssetId, language, prompt } = req.body as {
      mediaAssetId: string;
      language?: string;
      prompt?: string;
    };

    if (!mediaAssetId) {
      return res.status(400).json({ error: 'mediaAssetId is required' });
    }

    // Get the media asset
    const media = await prisma.mediaAsset.findUnique({
      where: { id: mediaAssetId },
    });

    if (!media) {
      return res.status(404).json({ error: 'Media asset not found' });
    }

    if (!media.mimeType?.startsWith('video/') && !media.mimeType?.startsWith('audio/')) {
      return res.status(400).json({ error: 'Media asset must be a video or audio file' });
    }

    // Download the media file
    let buffer: Buffer | null = null;

    if (!isS3Configured && media.originalKey) {
      buffer = await readFromLocalStorage(media.originalKey);
    } else if (media.originalUrl) {
      const response = await fetch(media.originalUrl);
      if (response.ok) {
        buffer = Buffer.from(await response.arrayBuffer());
      }
    }

    if (!buffer) {
      return res.status(404).json({ error: 'Could not download media file' });
    }

    console.log(`[Captions] Transcribing media asset ${mediaAssetId} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);

    const result = await transcribeWithWhisper(buffer, {
      language,
      mimeType: media.mimeType || 'video/mp4',
      prompt,
    });

    res.json({
      srt: result.srt,
      text: result.text,
      language: result.language,
      segmentCount: result.segments.length,
    });
  } catch (error) {
    console.error('[Captions] Transcription failed:', error);
    res.status(500).json({
      error: 'Transcription failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/captions/from-text — Generate SRT captions from a text script
 * Body: { text: string, durationSeconds: number, wordsPerChunk?: number }
 */
captionsRouter.post('/from-text', async (req, res) => {
  try {
    const { text, durationSeconds, wordsPerChunk } = req.body as {
      text: string;
      durationSeconds: number;
      wordsPerChunk?: number;
    };

    if (!text?.trim()) {
      return res.status(400).json({ error: 'text is required' });
    }
    if (!durationSeconds || durationSeconds <= 0) {
      return res.status(400).json({ error: 'durationSeconds must be positive' });
    }

    const result = generateSrtFromText(text, durationSeconds, { wordsPerChunk });

    res.json({
      srt: result.srt,
      text: result.text,
      segmentCount: result.segments.length,
    });
  } catch (error) {
    console.error('[Captions] SRT generation failed:', error);
    res.status(500).json({ error: 'SRT generation failed' });
  }
});
