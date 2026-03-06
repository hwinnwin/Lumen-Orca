import { env } from '../config/env.js';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFile, readFile, unlink, mkdtemp } from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * Caption Generator — uses OpenAI Whisper API for accurate video transcription,
 * then outputs SRT subtitles that can be:
 *   - Burned into video (TikTok, Instagram Reels) via ffmpeg
 *   - Uploaded as SRT file (YouTube closed captions)
 *
 * Supports two modes:
 *   1. Whisper API transcription (requires OPENAI_API_KEY)
 *   2. Script-based SRT generation (fallback, uses provided text)
 */

export interface CaptionResult {
  /** SRT formatted subtitle content */
  srt: string;
  /** Plain text transcript */
  text: string;
  /** Detected language */
  language?: string;
  /** Individual word-level segments (if available from Whisper) */
  segments: CaptionSegment[];
}

export interface CaptionSegment {
  start: number; // seconds
  end: number;   // seconds
  text: string;
}

/**
 * Check if Whisper transcription is available.
 */
export function isWhisperConfigured(): boolean {
  return Boolean(env.OPENAI_API_KEY);
}

/**
 * Transcribe a video/audio file using OpenAI Whisper API.
 * Returns SRT content and individual segments.
 */
export async function transcribeWithWhisper(
  videoBuffer: Buffer,
  options: {
    language?: string;   // ISO-639-1 code (e.g. 'en')
    mimeType?: string;   // 'video/mp4', 'audio/mp3', etc.
    prompt?: string;     // Optional context to improve accuracy
  } = {},
): Promise<CaptionResult> {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for Whisper transcription');
  }

  const tmpDir = await mkdtemp(join(tmpdir(), 'whisper-'));
  const ext = options.mimeType?.includes('audio') ? 'mp3' : 'mp4';
  const inputPath = join(tmpDir, `input.${ext}`);

  try {
    // Extract audio from video if needed (Whisper accepts audio directly)
    let audioBuffer: Buffer;

    if (options.mimeType?.startsWith('audio/')) {
      audioBuffer = videoBuffer;
    } else {
      // Extract audio track using ffmpeg
      await writeFile(inputPath, videoBuffer);
      const audioPath = join(tmpDir, 'audio.mp3');

      await execFileAsync('ffmpeg', [
        '-i', inputPath,
        '-vn',                    // No video
        '-acodec', 'libmp3lame',  // MP3 codec
        '-ar', '16000',           // 16kHz sample rate (optimal for Whisper)
        '-ac', '1',               // Mono
        '-q:a', '6',              // Good quality
        audioPath,
      ]);

      audioBuffer = await readFile(audioPath);
      await unlink(audioPath).catch(() => {});
    }

    // Call OpenAI Whisper API with verbose_json for word-level timestamps
    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(audioBuffer)], { type: 'audio/mp3' }), 'audio.mp3');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'segment');

    if (options.language) {
      formData.append('language', options.language);
    }
    if (options.prompt) {
      formData.append('prompt', options.prompt);
    }

    console.log('[CaptionGen] Sending audio to Whisper API...');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('[CaptionGen] Whisper API failed:', error);
      throw new Error(`Whisper API failed: ${error}`);
    }

    const data = await res.json() as {
      text: string;
      language: string;
      segments: Array<{
        id: number;
        start: number;
        end: number;
        text: string;
      }>;
    };

    console.log(`[CaptionGen] Whisper transcribed ${data.segments?.length || 0} segments, language: ${data.language}`);

    // Convert Whisper segments to our format
    const segments: CaptionSegment[] = (data.segments || []).map((s) => ({
      start: s.start,
      end: s.end,
      text: s.text.trim(),
    }));

    // Generate SRT from segments
    const srt = segmentsToSrt(segments);

    return {
      srt,
      text: data.text,
      language: data.language,
      segments,
    };
  } finally {
    // Cleanup temp files
    await unlink(inputPath).catch(() => {});
  }
}

/**
 * Generate SRT content from a text script (no Whisper needed).
 * Splits text into chunks timed evenly across the video duration.
 * This is the fallback when Whisper is not configured.
 */
export function generateSrtFromText(
  text: string,
  durationSeconds: number,
  options: {
    wordsPerChunk?: number;  // Default: 4
    maxCharsPerLine?: number; // Default: 40
  } = {},
): CaptionResult {
  const wordsPerChunk = options.wordsPerChunk || 4;
  const words = text.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return { srt: '', text: '', segments: [] };
  }

  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
  }

  const chunkDuration = durationSeconds / chunks.length;
  const segments: CaptionSegment[] = chunks.map((chunk, i) => ({
    start: i * chunkDuration,
    end: Math.min((i + 1) * chunkDuration, durationSeconds),
    text: chunk,
  }));

  return {
    srt: segmentsToSrt(segments),
    text,
    segments,
  };
}

/**
 * Burn SRT subtitles into a video buffer using ffmpeg.
 * Returns a new video buffer with burned-in captions.
 */
export async function burnCaptionsIntoVideo(
  videoBuffer: Buffer,
  srtContent: string,
  options: {
    fontName?: string;
    fontSize?: number;
    fontColor?: string;     // ASS color format (e.g. &H00FFFFFF for white)
    outlineColor?: string;  // ASS color format
    outlineWidth?: number;
    position?: 'bottom' | 'center' | 'top';
  } = {},
): Promise<Buffer> {
  const tmpDir = await mkdtemp(join(tmpdir(), 'caption-burn-'));
  const inputPath = join(tmpDir, 'input.mp4');
  const srtPath = join(tmpDir, 'captions.srt');
  const outputPath = join(tmpDir, 'output.mp4');

  const fontName = options.fontName || 'DejaVu Sans';
  const fontSize = options.fontSize || 22;
  const fontColor = options.fontColor || '&H00FFFFFF';
  const outlineColor = options.outlineColor || '&H00000000';
  const outlineWidth = options.outlineWidth || 2;
  const alignment = options.position === 'top' ? 6 : options.position === 'center' ? 5 : 2;

  try {
    await writeFile(inputPath, videoBuffer);
    await writeFile(srtPath, srtContent);

    // Escape the SRT path for ffmpeg subtitles filter
    const escapedSrtPath = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');

    await execFileAsync('ffmpeg', [
      '-i', inputPath,
      '-vf', `subtitles=${escapedSrtPath}:force_style='FontName=${fontName},FontSize=${fontSize},PrimaryColour=${fontColor},OutlineColour=${outlineColor},Outline=${outlineWidth},Bold=1,Alignment=${alignment}'`,
      '-c:a', 'copy',
      outputPath,
    ]);

    return await readFile(outputPath);
  } finally {
    await Promise.all([
      unlink(inputPath).catch(() => {}),
      unlink(srtPath).catch(() => {}),
      unlink(outputPath).catch(() => {}),
    ]);
  }
}

/**
 * Convert caption segments to SRT format.
 */
function segmentsToSrt(segments: CaptionSegment[]): string {
  return segments
    .map((seg, i) => {
      const startTime = formatSrtTime(seg.start);
      const endTime = formatSrtTime(seg.end);
      return `${i + 1}\n${startTime} --> ${endTime}\n${seg.text}`;
    })
    .join('\n\n');
}

/**
 * Format seconds to SRT time format: HH:MM:SS,mmm
 */
function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}
