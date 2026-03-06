import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdtemp, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { getAI, getReplicate, isReplicateConfigured } from './ai-clients.js';
import { uploadBuffer, generateMediaKey } from './s3.js';
import { buildPublicMediaUrl } from '../utils/signed-media-url.js';

const execFileAsync = promisify(execFile);

export { isReplicateConfigured };

// ─── Types ───────────────────────────────────────────────

export interface VideoSegment {
  segmentNumber: number;
  prompt: string;
  duration: 6 | 10;
}

export interface VideoPlan {
  prompt: string;
  caption: string;
  hashtags: string[];
  duration: number;
  aspectRatio: string;
  platform: string;
  segments?: VideoSegment[];
  voiceoverScript?: string;
  musicStyle?: string;
  totalDuration?: number;
}

export interface GeneratedVideo {
  videoUrl: string;
  storageKey: string;
  duration: number;
}

export type VideoPlatform = 'reels' | 'tiktok' | 'shorts';

export interface AudioOptions {
  music: boolean;
  musicStyle?: string;
  voiceover: boolean;
}

// ─── Platform Config ─────────────────────────────────────

const PLATFORM_CONFIG: Record<VideoPlatform, { aspectRatio: string; label: string }> = {
  reels: { aspectRatio: '9:16', label: 'Instagram Reels' },
  tiktok: { aspectRatio: '9:16', label: 'TikTok' },
  shorts: { aspectRatio: '9:16', label: 'YouTube Shorts' },
};

// ─── Video Planning (Claude) ─────────────────────────────

const VIDEO_SYSTEM_PROMPT = `You are a creative director specializing in short-form video content for social media. You craft compelling video concepts optimized for Instagram Reels, TikTok, and YouTube Shorts.

## Video Content Psychology
- The first 1-2 seconds determine if someone watches or scrolls — your concept must hook INSTANTLY
- Short-form video (6-10 seconds) works best as a single powerful moment, not a mini-story
- Visual spectacle > narrative complexity for ultra-short content
- Motion, transformation, and reveal are the most engaging visual patterns
- Text overlays in video should be minimal — the visual IS the content

## Prompt Engineering for AI Video
- Describe the scene cinematically: camera angle, movement, lighting, atmosphere
- Specify the subject clearly: what's in frame, what they're doing, what's happening
- Include motion direction: "slowly zooms in", "camera pans right", "dolly forward"
- Set the mood: color grading, time of day, weather, emotional tone
- Be specific about style: "cinematic", "drone shot", "macro photography", "timelapse"

## Multi-Segment Videos
When creating longer videos (>10 seconds), break them into 6-10 second segments.
Each segment should have visual continuity with the previous one — same color grading, similar camera style, and narrative flow.
Segments should transition naturally — think of each as a "shot" in a sequence.

## Caption Strategy for Short-Form Video
- Hook in the first line (question, bold statement, or curiosity gap)
- Keep it conversational and punchy — not essay-length
- End with a CTA: "Follow for more", "Save this", "Tag someone who needs this"
- Hashtags: mix niche + broad, 5-10 total`;

/**
 * Plan a video — supports both single-segment (<=10s) and multi-segment (>10s) videos.
 * For multi-segment, Claude plans individual segment prompts, voiceover script, and music style.
 */
export async function planVideo(
  topic: string,
  platform: VideoPlatform,
  tone: string,
  totalDuration = 6,
  audioOptions?: AudioOptions,
): Promise<VideoPlan> {
  const client = getAI();
  const config = PLATFORM_CONFIG[platform];
  const isMultiSegment = totalDuration > 10;

  // Determine number of segments (each 6-10s)
  const segmentCount = isMultiSegment ? Math.ceil(totalDuration / 10) : 1;
  const segmentDuration: 6 | 10 = isMultiSegment ? 10 : (totalDuration <= 6 ? 6 : 10);

  const audioInstructions = [];
  if (audioOptions?.voiceover) {
    audioInstructions.push(`4. A voiceover narration script that fits within ${Math.floor(totalDuration * 0.85)} seconds when spoken aloud (~${Math.floor(totalDuration * 0.85 * 2.5)} words). Keep it concise — it's better to finish slightly early than to get cut off. Write it as a continuous script, not per-segment. Make it conversational and engaging.`);
  }
  if (audioOptions?.music) {
    audioInstructions.push(`${audioOptions.voiceover ? '5' : '4'}. A brief music style description (3-8 words) for background music, e.g. "upbeat electronic with soft beats" or "calm ambient piano"${audioOptions.musicStyle ? `. User preference: "${audioOptions.musicStyle}"` : ''}`);
  }

  const segmentsInstruction = isMultiSegment
    ? `This is a ${totalDuration}-second video broken into ${segmentCount} segments of ~${segmentDuration}s each.
For each segment, provide a detailed video generation prompt (50-80 words) describing the visual scene, camera movement, lighting, and atmosphere. Each segment will be generated independently by an AI video model, so ensure visual continuity across segments (same style, color grading, subject consistency).`
    : `Duration: ${segmentDuration} seconds
Provide a detailed video generation prompt (50-80 words) describing the visual scene, camera movement, lighting, and atmosphere.`;

  const jsonStructure = isMultiSegment
    ? `{
  "segments": [
    { "segmentNumber": 1, "prompt": "detailed prompt for segment 1" },
    { "segmentNumber": 2, "prompt": "detailed prompt for segment 2" }
  ],
  "caption": "social media caption",
  "hashtags": ["hashtag1", "hashtag2"]${audioOptions?.voiceover ? ',\n  "voiceoverScript": "full narration script here"' : ''}${audioOptions?.music ? ',\n  "musicStyle": "music style description"' : ''}
}`
    : `{
  "prompt": "detailed video generation prompt here",
  "caption": "social media caption",
  "hashtags": ["hashtag1", "hashtag2"]${audioOptions?.voiceover ? ',\n  "voiceoverScript": "full narration script here"' : ''}${audioOptions?.music ? ',\n  "musicStyle": "music style description"' : ''}
}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: VIDEO_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Create a video concept for ${config.label}.

Topic: ${topic}
Tone: ${tone}
Aspect ratio: ${config.aspectRatio} (vertical)
${segmentsInstruction}

Provide:
1. ${isMultiSegment ? 'Video generation prompts for each segment (as described above)' : 'A detailed video generation prompt (50-80 words)'}
2. A social media caption optimized for ${config.label}
3. 5-10 relevant hashtags
${audioInstructions.join('\n')}

Respond in JSON:
${jsonStructure}`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text);

    const segments: VideoSegment[] = isMultiSegment
      ? (parsed.segments || []).map((s: { segmentNumber: number; prompt: string }) => ({
          segmentNumber: s.segmentNumber,
          prompt: s.prompt,
          duration: segmentDuration,
        }))
      : [{ segmentNumber: 1, prompt: parsed.prompt || topic, duration: segmentDuration }];

    return {
      prompt: isMultiSegment ? segments.map((s) => s.prompt).join(' | ') : (parsed.prompt || topic),
      caption: parsed.caption || '',
      hashtags: parsed.hashtags || [],
      duration: segmentDuration,
      aspectRatio: config.aspectRatio,
      platform,
      segments,
      voiceoverScript: parsed.voiceoverScript || undefined,
      musicStyle: parsed.musicStyle || audioOptions?.musicStyle || undefined,
      totalDuration,
    };
  } catch {
    throw new Error('Failed to parse video plan from AI response');
  }
}

// ─── Video Generation (Replicate) ────────────────────────

/**
 * Generate a video using Replicate's MiniMax Hailuo 2.3 model.
 * Supports text-to-video and image-to-video modes.
 *
 * Model: minimax/hailuo-2.3
 * - 768p or 1080p output
 * - 6 or 10 second clips
 * - ~$0.07-$0.10/sec (~$0.42-$0.60 per 6s clip)
 * - Generation time: 30-120 seconds
 */
export async function generateVideo(
  params: {
    prompt: string;
    sourceImageUrl?: string;
    duration?: 6 | 10;
    aspectRatio?: '9:16' | '1:1' | '16:9';
  },
  userId: string,
): Promise<GeneratedVideo> {
  const replicate = getReplicate();

  if (!replicate) {
    throw new Error('Video generation requires REPLICATE_API_TOKEN. Add it to your environment variables.');
  }

  const { prompt, sourceImageUrl, duration = 6, aspectRatio = '9:16' } = params;

  console.log(`[VideoGenerator] Generating ${duration}s video (${aspectRatio})${sourceImageUrl ? ' from image' : ' from text'}...`);

  const input: Record<string, unknown> = {
    prompt,
    duration,
    aspect_ratio: aspectRatio,
  };

  // Image-to-video mode
  if (sourceImageUrl) {
    input.image_url = sourceImageUrl;
  }

  const output = await replicate.run(
    'minimax/hailuo-2.3',
    { input },
  );

  console.log(`[VideoGenerator] Replicate output type: ${typeof output}, isArray: ${Array.isArray(output)}`);

  // Hailuo may return a FileOutput object, a URL string, or an array
  const videoResult = Array.isArray(output) ? output[0] : output;
  let videoBuffer: Buffer;

  if (typeof videoResult === 'string') {
    // Plain URL string
    console.log(`[VideoGenerator] Fetching video from URL: ${videoResult.substring(0, 80)}...`);
    const response = await fetch(videoResult);
    if (!response.ok) {
      throw new Error(`Failed to download generated video: ${response.status}`);
    }
    videoBuffer = Buffer.from(await response.arrayBuffer());
  } else if (videoResult && typeof videoResult === 'object' && 'url' in (videoResult as any)) {
    // FileOutput object — get URL then fetch
    const u = (videoResult as any).url;
    const fileUrl = typeof u === 'function' ? u() : u;
    console.log(`[VideoGenerator] Fetching video from FileOutput URL: ${String(fileUrl).substring(0, 80)}...`);
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download generated video: ${response.status}`);
    }
    videoBuffer = Buffer.from(await response.arrayBuffer());
  } else if (videoResult && typeof videoResult === 'object' && typeof (videoResult as any).blob === 'function') {
    // FileOutput as ReadableStream — use blob()
    console.log(`[VideoGenerator] Reading video from FileOutput blob...`);
    const blob = await (videoResult as any).blob();
    videoBuffer = Buffer.from(await blob.arrayBuffer());
  } else {
    // Last resort — try to fetch as URL
    console.log(`[VideoGenerator] Fallback: treating output as URL: ${String(videoResult).substring(0, 80)}...`);
    const response = await fetch(videoResult as any);
    if (!response.ok) {
      throw new Error(`Failed to download generated video: ${response.status}`);
    }
    videoBuffer = Buffer.from(await response.arrayBuffer());
  }

  console.log(`[VideoGenerator] Downloaded video: ${(videoBuffer.length / 1024 / 1024).toFixed(1)}MB`);

  // Upload to storage
  const key = generateMediaKey(userId, `generated-video-${Date.now()}.mp4`);
  await uploadBuffer(key, videoBuffer, 'video/mp4');

  // Return a signed public URL so <video> elements can access it without auth headers
  const publicUrl = buildPublicMediaUrl(key, 3600); // 1 hour TTL

  return {
    videoUrl: publicUrl,
    storageKey: key,
    duration,
  };
}

// ─── Audio Generation (Replicate) ────────────────────────

/**
 * Generate background music using Meta MusicGen.
 * Returns an audio buffer (WAV).
 */
export async function generateMusic(
  stylePrompt: string,
  durationSeconds: number,
): Promise<Buffer> {
  const replicate = getReplicate();
  if (!replicate) throw new Error('Music generation requires REPLICATE_API_TOKEN.');

  const dur = Math.min(Math.max(durationSeconds, 1), 30);
  console.log(`[VideoGenerator] Generating ${dur}s music: "${stylePrompt}"`);

  const output = await replicate.run(
    'meta/musicgen:b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38',
    {
      input: {
        prompt: stylePrompt,
        duration: dur,
        model_version: 'stereo-large',
        output_format: 'wav',
      },
    },
  );

  console.log(`[VideoGenerator] MusicGen output type: ${typeof output}, isArray: ${Array.isArray(output)}, value: ${JSON.stringify(output).slice(0, 200)}`);
  return fetchReplicateOutput(output, 'music');
}

/** Available voiceover voices for MiniMax Speech-02-HD */
export const VOICEOVER_VOICES = [
  { id: 'Deep_Voice_Man', label: 'Deep Male', gender: 'male' },
  { id: 'Casual_Guy', label: 'Casual Male', gender: 'male' },
  { id: 'Patient_Man', label: 'Patient Male', gender: 'male' },
  { id: 'Determined_Man', label: 'Determined Male', gender: 'male' },
  { id: 'Elegant_Man', label: 'Elegant Male', gender: 'male' },
  { id: 'Wise_Woman', label: 'Wise Female', gender: 'female' },
  { id: 'Calm_Woman', label: 'Calm Female', gender: 'female' },
  { id: 'Inspirational_girl', label: 'Inspirational Female', gender: 'female' },
  { id: 'Lively_Girl', label: 'Lively Female', gender: 'female' },
  { id: 'Friendly_Person', label: 'Friendly (Neutral)', gender: 'neutral' },
] as const;

export type VoiceId = (typeof VOICEOVER_VOICES)[number]['id'];

/**
 * Generate voiceover using MiniMax Speech-02-HD.
 * Returns an audio buffer (MP3).
 */
export async function generateVoiceover(
  script: string,
  voiceId: string = 'Deep_Voice_Man',
): Promise<Buffer> {
  const replicate = getReplicate();
  if (!replicate) throw new Error('Voiceover generation requires REPLICATE_API_TOKEN.');

  console.log(`[VideoGenerator] Generating voiceover (${script.length} chars, voice: ${voiceId})`);

  const output = await replicate.run(
    'minimax/speech-02-hd' as `${string}/${string}`,
    {
      input: {
        text: script,
        voice_id: voiceId,
        speed: 1.0,
      },
    },
  );

  return fetchReplicateOutput(output, 'voiceover');
}

/**
 * Helper to download a Replicate output into a Buffer.
 * Handles string URLs, FileOutput objects, ReadableStreams, and blob-based outputs.
 */
async function fetchReplicateOutput(output: unknown, label: string): Promise<Buffer> {
  // Unwrap arrays (some models return [url] instead of url)
  const result = Array.isArray(output) ? output[0] : output;

  // Case 1: Direct URL string
  if (typeof result === 'string') {
    console.log(`[fetchReplicateOutput] ${label}: downloading from URL string`);
    const response = await fetch(result);
    if (!response.ok) throw new Error(`Failed to download ${label}: ${response.status} ${response.statusText}`);
    return Buffer.from(await response.arrayBuffer());
  }

  if (result && typeof result === 'object') {
    const obj = result as Record<string, unknown>;

    // Case 2: FileOutput with .url() method or .url property
    if ('url' in obj) {
      const u = obj.url;
      const fileUrl = typeof u === 'function' ? u() : u;
      console.log(`[fetchReplicateOutput] ${label}: downloading from FileOutput url`);
      const response = await fetch(fileUrl as string);
      if (!response.ok) throw new Error(`Failed to download ${label}: ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    }

    // Case 3: ReadableStream (newer Replicate SDK)
    if (typeof obj.getReader === 'function') {
      console.log(`[fetchReplicateOutput] ${label}: reading from ReadableStream`);
      const reader = (obj as unknown as ReadableStream<Uint8Array>).getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      return Buffer.concat(chunks);
    }

    // Case 4: Blob-like object
    if (typeof obj.blob === 'function') {
      console.log(`[fetchReplicateOutput] ${label}: reading from blob`);
      const blob = await (obj.blob as () => Promise<Blob>)();
      return Buffer.from(await blob.arrayBuffer());
    }

    // Case 5: arrayBuffer directly
    if (typeof obj.arrayBuffer === 'function') {
      console.log(`[fetchReplicateOutput] ${label}: reading from arrayBuffer`);
      const ab = await (obj.arrayBuffer as () => Promise<ArrayBuffer>)();
      return Buffer.from(ab);
    }
  }

  // Fallback: try treating as URL string
  console.log(`[fetchReplicateOutput] ${label}: fallback — treating as URL: ${String(result).slice(0, 200)}`);
  const response = await fetch(result as string);
  if (!response.ok) throw new Error(`Failed to download ${label}: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

// ─── Caption Generation ─────────────────────────────────

/**
 * Generate SRT subtitle content from a voiceover script.
 * Splits script into ~3-4 word chunks timed evenly across the video duration.
 */
function generateSrtFromScript(script: string, totalDuration: number): string {
  const words = script.split(/\s+/).filter(Boolean);
  const wordsPerChunk = 4;
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
  }

  if (chunks.length === 0) return '';

  const chunkDuration = totalDuration / chunks.length;
  const lines: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const start = i * chunkDuration;
    const end = Math.min((i + 1) * chunkDuration, totalDuration);
    lines.push(`${i + 1}`);
    lines.push(`${formatSrtTime(start)} --> ${formatSrtTime(end)}`);
    lines.push(chunks[i]);
    lines.push('');
  }

  return lines.join('\n');
}

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

// ─── Voiceover Tempo Adjustment ─────────────────────────

/**
 * Speed-adjust a voiceover audio file to fit within a target video duration.
 * Uses ffmpeg's atempo filter (valid range: 0.5–2.0, chained for larger adjustments).
 * If voiceover is longer than video, speeds it up. If shorter, leaves it alone.
 * Copies the raw file if no adjustment is needed.
 */
async function adjustVoiceoverTempo(
  inputPath: string,
  outputPath: string,
  targetDuration: number,
  _tmpDir: string,
): Promise<void> {
  if (targetDuration <= 0) {
    // No video duration available — copy as-is
    await execFileAsync('cp', [inputPath, outputPath]);
    return;
  }

  // Probe voiceover duration
  let voiceoverDuration = 0;
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', inputPath,
    ], { timeout: 10000 });
    const parsed = parseFloat(stdout.trim());
    if (!isNaN(parsed) && parsed > 0) voiceoverDuration = parsed;
  } catch { /* skip adjustment */ }

  if (voiceoverDuration <= 0 || voiceoverDuration <= targetDuration * 1.05) {
    // Voiceover fits within video (or within 5% tolerance) — no adjustment needed
    await execFileAsync('cp', [inputPath, outputPath]);
    console.log(`[VideoGenerator] Voiceover ${voiceoverDuration.toFixed(1)}s fits in ${targetDuration.toFixed(1)}s video — no tempo change`);
    return;
  }

  // Calculate speed ratio: how much faster to play
  const ratio = voiceoverDuration / targetDuration;
  // Clamp to reasonable range: max 1.8x speedup (don't make it sound too chipmunky)
  const clampedRatio = Math.min(ratio, 1.8);

  // Build atempo filter chain (each atempo node: 0.5–2.0)
  const atempoFilters: string[] = [];
  let remaining = clampedRatio;
  while (remaining > 1.001) {
    const step = Math.min(remaining, 2.0);
    atempoFilters.push(`atempo=${step.toFixed(4)}`);
    remaining /= step;
  }

  const filterChain = atempoFilters.join(',');
  console.log(`[VideoGenerator] Adjusting voiceover tempo: ${voiceoverDuration.toFixed(1)}s → ${(voiceoverDuration / clampedRatio).toFixed(1)}s (${clampedRatio.toFixed(2)}x speed, filter: ${filterChain})`);

  await execFileAsync('ffmpeg', [
    '-y', '-i', inputPath,
    '-af', filterChain,
    '-c:a', 'libmp3lame', '-b:a', '192k',
    outputPath,
  ], { timeout: 60000 });
}

// ─── FFmpeg Stitching ────────────────────────────────────

/**
 * Stitch multiple video segments together, optionally adding music, voiceover, and captions.
 * Uses ffmpeg CLI via child_process.
 *
 * Pipeline:
 * 1. Concatenate video segments into one MP4
 * 2. If music + voiceover: mix them (music at 30% volume when voiceover present)
 * 3. Merge audio onto the concatenated video
 * 4. If captionText provided: burn SRT subtitles into video
 */
export async function stitchVideo(
  videoBuffers: Buffer[],
  musicBuffer?: Buffer,
  voiceoverBuffer?: Buffer,
  captionText?: string,
): Promise<Buffer> {
  const tmpDir = await mkdtemp(join(tmpdir(), 'scc-video-'));

  try {
    // Write video segments to temp files
    const segmentPaths: string[] = [];
    for (let i = 0; i < videoBuffers.length; i++) {
      const path = join(tmpDir, `segment_${i}.mp4`);
      await writeFile(path, videoBuffers[i]);
      segmentPaths.push(path);
    }

    let currentVideoPath: string;

    if (segmentPaths.length === 1) {
      currentVideoPath = segmentPaths[0];
    } else {
      // Create concat list file
      const concatList = segmentPaths.map((p) => `file '${p}'`).join('\n');
      const concatListPath = join(tmpDir, 'concat.txt');
      await writeFile(concatListPath, concatList);

      // Concatenate video segments
      currentVideoPath = join(tmpDir, 'concat.mp4');
      await execFileAsync('ffmpeg', [
        '-y', '-f', 'concat', '-safe', '0',
        '-i', concatListPath,
        '-c', 'copy',
        currentVideoPath,
      ], { timeout: 120000 });

      console.log(`[VideoGenerator] Concatenated ${segmentPaths.length} segments`);
    }

    // If no audio and no captions, return the concatenated video
    if (!musicBuffer && !voiceoverBuffer && !captionText) {
      return await readFile(currentVideoPath);
    }

    // If no audio but captions requested, burn captions directly
    if (!musicBuffer && !voiceoverBuffer && captionText) {
      let videoDuration = 30;
      try {
        const { stdout } = await execFileAsync('ffprobe', [
          '-v', 'error', '-show_entries', 'format=duration',
          '-of', 'default=noprint_wrappers=1:nokey=1', currentVideoPath,
        ], { timeout: 10000 });
        const parsed = parseFloat(stdout.trim());
        if (!isNaN(parsed) && parsed > 0) videoDuration = parsed;
      } catch { /* use fallback */ }

      const srtContent = generateSrtFromScript(captionText, videoDuration);
      const srtPath = join(tmpDir, 'captions.srt');
      await writeFile(srtPath, srtContent);

      const captionedPath = join(tmpDir, 'captioned.mp4');
      const escapedSrtPath = srtPath.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
      await execFileAsync('ffmpeg', [
        '-y', '-i', currentVideoPath,
        '-vf', `subtitles=${escapedSrtPath}:force_style='FontName=DejaVu Sans,FontSize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Bold=1,Alignment=2'`,
        '-c:a', 'copy',
        captionedPath,
      ], { timeout: 180000 });

      console.log(`[VideoGenerator] Burned captions into video (no audio)`);
      return await readFile(captionedPath);
    }

    // Probe video duration for voiceover timing
    let videoDuration = 0;
    try {
      const { stdout } = await execFileAsync('ffprobe', [
        '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1', currentVideoPath,
      ], { timeout: 10000 });
      const parsed = parseFloat(stdout.trim());
      if (!isNaN(parsed) && parsed > 0) videoDuration = parsed;
    } catch { /* will use 0 = skip tempo adjustment */ }

    // Write audio files
    let audioPath: string | undefined;

    if (musicBuffer && voiceoverBuffer) {
      const musicPath = join(tmpDir, 'music.wav');
      const voiceoverRawPath = join(tmpDir, 'voiceover_raw.mp3');
      const voiceoverPath = join(tmpDir, 'voiceover.mp3');
      audioPath = join(tmpDir, 'mixed_audio.aac');

      await writeFile(musicPath, musicBuffer);
      await writeFile(voiceoverRawPath, voiceoverBuffer);

      // Speed-adjust voiceover to fit video duration (atempo 0.5-2.0)
      await adjustVoiceoverTempo(voiceoverRawPath, voiceoverPath, videoDuration, tmpDir);

      // Mix music (at 30% volume) + voiceover into one audio track
      await execFileAsync('ffmpeg', [
        '-y',
        '-stream_loop', '-1', '-i', musicPath,
        '-i', voiceoverPath,
        '-filter_complex', '[0:a]volume=0.2[music];[1:a]volume=1.0[voice];[music][voice]amix=inputs=2:duration=longest[out]',
        '-map', '[out]',
        '-c:a', 'aac', '-b:a', '192k',
        '-t', '300', // max 5 min safety cap
        audioPath,
      ], { timeout: 120000 });

      console.log(`[VideoGenerator] Mixed music + voiceover`);
    } else if (musicBuffer) {
      const musicPath = join(tmpDir, 'music.wav');
      audioPath = join(tmpDir, 'audio.aac');
      await writeFile(musicPath, musicBuffer);

      // Convert and trim music to AAC
      await execFileAsync('ffmpeg', [
        '-y',
        '-stream_loop', '-1', '-i', musicPath,
        '-c:a', 'aac', '-b:a', '192k',
        '-t', '300',
        audioPath,
      ], { timeout: 120000 });

      console.log(`[VideoGenerator] Prepared music audio`);
    } else if (voiceoverBuffer) {
      const voiceoverRawPath = join(tmpDir, 'voiceover_raw.mp3');
      const voiceoverPath = join(tmpDir, 'voiceover.mp3');
      audioPath = join(tmpDir, 'audio.aac');
      await writeFile(voiceoverRawPath, voiceoverBuffer);

      // Speed-adjust voiceover to fit video duration
      await adjustVoiceoverTempo(voiceoverRawPath, voiceoverPath, videoDuration, tmpDir);

      await execFileAsync('ffmpeg', [
        '-y', '-i', voiceoverPath,
        '-c:a', 'aac', '-b:a', '192k',
        audioPath,
      ], { timeout: 120000 });

      console.log(`[VideoGenerator] Prepared voiceover audio`);
    }

    // Merge audio onto video
    const finalPath = join(tmpDir, 'final.mp4');
    await execFileAsync('ffmpeg', [
      '-y',
      '-i', currentVideoPath,
      '-i', audioPath!,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-shortest',
      finalPath,
    ], { timeout: 120000 });

    console.log(`[VideoGenerator] Final video with audio ready`);

    // Burn captions if provided
    if (captionText) {
      // Probe video duration for accurate SRT timing
      let videoDuration = 30; // fallback
      try {
        const { stdout } = await execFileAsync('ffprobe', [
          '-v', 'error', '-show_entries', 'format=duration',
          '-of', 'default=noprint_wrappers=1:nokey=1', finalPath,
        ], { timeout: 10000 });
        const parsed = parseFloat(stdout.trim());
        if (!isNaN(parsed) && parsed > 0) videoDuration = parsed;
      } catch { /* use fallback */ }

      const srtContent = generateSrtFromScript(captionText, videoDuration);
      const srtPath = join(tmpDir, 'captions.srt');
      await writeFile(srtPath, srtContent);

      const captionedPath = join(tmpDir, 'final_captioned.mp4');
      // Escape path for ffmpeg subtitles filter (colons and backslashes)
      const escapedSrtPath = srtPath.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
      await execFileAsync('ffmpeg', [
        '-y', '-i', finalPath,
        '-vf', `subtitles=${escapedSrtPath}:force_style='FontName=DejaVu Sans,FontSize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Bold=1,Alignment=2'`,
        '-c:a', 'copy',
        captionedPath,
      ], { timeout: 180000 });

      console.log(`[VideoGenerator] Burned captions into video (${srtContent.split('\n\n').length} entries)`);
      return await readFile(captionedPath);
    }

    return await readFile(finalPath);
  } finally {
    // Clean up temp directory
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

// ─── Multi-Segment Video Generation ─────────────────────

/**
 * Generate a multi-segment video with optional audio.
 * Generates each segment independently, then stitches with ffmpeg.
 */
export async function generateMultiSegmentVideo(
  params: {
    segments: VideoSegment[];
    aspectRatio?: '9:16' | '1:1' | '16:9';
    voiceoverScript?: string;
    voiceoverVoice?: string;
    musicStyle?: string;
    captionText?: string;
  },
  userId: string,
): Promise<GeneratedVideo> {
  const { segments, aspectRatio = '9:16', voiceoverScript, voiceoverVoice, musicStyle, captionText } = params;

  console.log(`[VideoGenerator] Generating ${segments.length}-segment video with${musicStyle ? ' music' : ''}${voiceoverScript ? ' voiceover' : ''}`);

  // Generate all video segments (sequentially to avoid rate limits)
  const videoBuffers: Buffer[] = [];
  for (const segment of segments) {
    console.log(`[VideoGenerator] Generating segment ${segment.segmentNumber}/${segments.length}...`);
    const replicate = getReplicate();
    if (!replicate) throw new Error('Video generation requires REPLICATE_API_TOKEN.');

    const input: Record<string, unknown> = {
      prompt: segment.prompt,
      duration: segment.duration,
      aspect_ratio: aspectRatio,
    };

    const output = await replicate.run('minimax/hailuo-2.3', { input });
    const buffer = await fetchReplicateOutput(output, `segment-${segment.segmentNumber}`);
    videoBuffers.push(buffer);
    console.log(`[VideoGenerator] Segment ${segment.segmentNumber} done (${(buffer.length / 1024 / 1024).toFixed(1)}MB)`);
  }

  // Generate audio tracks in parallel
  const [musicBuffer, voiceoverBuffer] = await Promise.all([
    musicStyle ? generateMusic(musicStyle, segments.reduce((sum, s) => sum + s.duration, 0)).catch((err) => {
      console.warn(`[VideoGenerator] Music generation failed, continuing without:`, err);
      return undefined;
    }) : undefined,
    voiceoverScript ? generateVoiceover(voiceoverScript, voiceoverVoice).catch((err) => {
      console.warn(`[VideoGenerator] Voiceover generation failed, continuing without:`, err);
      return undefined;
    }) : undefined,
  ]);

  // Stitch everything together (with optional captions)
  const finalBuffer = await stitchVideo(videoBuffers, musicBuffer, voiceoverBuffer, captionText);
  const totalDuration = segments.reduce((sum, s) => sum + s.duration, 0);

  console.log(`[VideoGenerator] Final video: ${(finalBuffer.length / 1024 / 1024).toFixed(1)}MB, ~${totalDuration}s`);

  // Upload to storage
  const key = generateMediaKey(userId, `generated-video-${Date.now()}.mp4`);
  await uploadBuffer(key, finalBuffer, 'video/mp4');
  const publicUrl = buildPublicMediaUrl(key, 3600);

  return {
    videoUrl: publicUrl,
    storageKey: key,
    duration: totalDuration,
  };
}

/**
 * Animate an existing image (e.g. carousel slide) into a video clip.
 * Uses image-to-video mode of Hailuo 2.3.
 */
export async function generateVideoFromSlide(
  slideImageUrl: string,
  motionPrompt: string,
  userId: string,
  duration: 6 | 10 = 6,
): Promise<GeneratedVideo> {
  const prompt = motionPrompt || 'Subtle cinematic motion, gentle zoom in with soft parallax depth effect, dreamy atmosphere';

  return generateVideo(
    {
      prompt,
      sourceImageUrl: slideImageUrl,
      duration,
      aspectRatio: '9:16',
    },
    userId,
  );
}

// ─── Video Editor Export ────────────────────────────────

/**
 * Export an edited video from user-uploaded clips + optional audio.
 * Downloads clips from storage, trims/re-encodes, concatenates, mixes audio, uploads result.
 */
export async function exportEditedVideo(
  clips: Array<{ storageKey: string; startTime?: number; endTime?: number }>,
  audioStorageKey: string | undefined,
  audioVolume: number,
  userId: string,
  musicStyle?: string,
  voiceoverScript?: string,
  voiceoverVoice?: string,
): Promise<GeneratedVideo> {
  const { downloadBuffer } = await import('./s3.js');
  const tmpDir = await mkdtemp(join(tmpdir(), 'scc-export-'));

  try {
    // Download and prepare each clip
    const normalizedPaths: string[] = [];
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      console.log(`[VideoExport] Downloading clip ${i + 1}/${clips.length}: ${clip.storageKey}`);
      const buffer = await downloadBuffer(clip.storageKey);
      const rawPath = join(tmpDir, `raw_${i}.mp4`);
      await writeFile(rawPath, buffer);

      // Re-encode + trim to uniform format for safe concatenation
      const normalizedPath = join(tmpDir, `clip_${i}.mp4`);
      const ffmpegArgs = ['-y'];

      // Trim: seek to start time
      if (clip.startTime !== undefined && clip.startTime > 0) {
        ffmpegArgs.push('-ss', String(clip.startTime));
      }

      ffmpegArgs.push('-i', rawPath);

      // Trim: set duration from start to end
      if (clip.endTime !== undefined) {
        const startOffset = clip.startTime || 0;
        const duration = clip.endTime - startOffset;
        if (duration > 0) {
          ffmpegArgs.push('-t', String(duration));
        }
      }

      // Re-encode to uniform H.264 + AAC, 30fps, scale to 1080 height preserving aspect ratio
      ffmpegArgs.push(
        '-vf', 'scale=-2:1080',
        '-r', '30',
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
        '-c:a', 'aac', '-b:a', '128k',
        '-movflags', '+faststart',
        normalizedPath,
      );

      await execFileAsync('ffmpeg', ffmpegArgs, { timeout: 300000 });
      normalizedPaths.push(normalizedPath);
      console.log(`[VideoExport] Clip ${i + 1} normalized`);
    }

    // Concatenate all clips
    let currentVideoPath: string;

    if (normalizedPaths.length === 1) {
      currentVideoPath = normalizedPaths[0];
    } else {
      const concatList = normalizedPaths.map((p) => `file '${p}'`).join('\n');
      const concatListPath = join(tmpDir, 'concat.txt');
      await writeFile(concatListPath, concatList);

      currentVideoPath = join(tmpDir, 'concat.mp4');
      await execFileAsync('ffmpeg', [
        '-y', '-f', 'concat', '-safe', '0',
        '-i', concatListPath,
        '-c', 'copy',
        currentVideoPath,
      ], { timeout: 300000 });

      console.log(`[VideoExport] Concatenated ${normalizedPaths.length} clips`);
    }

    // Generate AI audio if requested (music or voiceover)
    let generatedAudioPath: string | undefined;
    if (musicStyle && !audioStorageKey) {
      console.log(`[VideoExport] Generating AI music: "${musicStyle}"`);
      // Probe video duration for music length
      let videoDur = 30;
      try {
        const { stdout } = await execFileAsync('ffprobe', [
          '-v', 'error', '-show_entries', 'format=duration',
          '-of', 'default=noprint_wrappers=1:nokey=1', currentVideoPath,
        ], { timeout: 10000 });
        const parsed = parseFloat(stdout.trim());
        if (!isNaN(parsed) && parsed > 0) videoDur = Math.min(parsed, 30);
      } catch { /* use fallback */ }
      const musicBuffer = await generateMusic(musicStyle, videoDur);
      generatedAudioPath = join(tmpDir, 'ai_music.wav');
      await writeFile(generatedAudioPath, musicBuffer);
      console.log(`[VideoExport] AI music generated (${videoDur}s)`);
    } else if (voiceoverScript && !audioStorageKey) {
      console.log(`[VideoExport] Generating AI voiceover`);
      const voBuffer = await generateVoiceover(voiceoverScript, voiceoverVoice || 'Deep_Voice_Man');
      generatedAudioPath = join(tmpDir, 'ai_voiceover.mp3');
      await writeFile(generatedAudioPath, voBuffer);
      console.log(`[VideoExport] AI voiceover generated`);
    }

    // Mix audio if provided
    const effectiveAudioPath = generatedAudioPath;
    if (audioStorageKey) {
      console.log(`[VideoExport] Downloading audio: ${audioStorageKey}`);
      const audioBuffer = await downloadBuffer(audioStorageKey);
      const audioPath = join(tmpDir, 'audio_input.mp3');
      await writeFile(audioPath, audioBuffer);

      const vol = Math.max(0, Math.min(100, audioVolume)) / 100;
      const withAudioPath = join(tmpDir, 'with_audio.mp4');

      await execFileAsync('ffmpeg', [
        '-y',
        '-i', currentVideoPath,
        '-i', audioPath,
        '-filter_complex', `[1:a]volume=${vol}[aud]`,
        '-map', '0:v',
        '-map', '[aud]',
        '-c:v', 'copy',
        '-c:a', 'aac', '-b:a', '192k',
        '-shortest',
        withAudioPath,
      ], { timeout: 300000 });

      currentVideoPath = withAudioPath;
      console.log(`[VideoExport] Mixed audio at ${audioVolume}% volume`);
    } else if (effectiveAudioPath) {
      // Mix AI-generated audio
      const vol = Math.max(0, Math.min(100, audioVolume)) / 100;
      const withAudioPath = join(tmpDir, 'with_ai_audio.mp4');

      await execFileAsync('ffmpeg', [
        '-y',
        '-i', currentVideoPath,
        '-i', effectiveAudioPath,
        '-filter_complex', `[1:a]volume=${vol}[aud]`,
        '-map', '0:v',
        '-map', '[aud]',
        '-c:v', 'copy',
        '-c:a', 'aac', '-b:a', '192k',
        '-shortest',
        withAudioPath,
      ], { timeout: 300000 });

      currentVideoPath = withAudioPath;
      console.log(`[VideoExport] Mixed AI audio at ${audioVolume}% volume`);
    }

    // Probe final duration
    let duration = 0;
    try {
      const { stdout } = await execFileAsync('ffprobe', [
        '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1', currentVideoPath,
      ], { timeout: 10000 });
      const parsed = parseFloat(stdout.trim());
      if (!isNaN(parsed) && parsed > 0) duration = Math.round(parsed);
    } catch { /* use 0 */ }

    // Upload final video
    const finalBuffer = await readFile(currentVideoPath);
    const storageKey = generateMediaKey(userId, 'export.mp4');
    const videoUrl = await uploadBuffer(storageKey, finalBuffer, 'video/mp4');
    const publicUrl = buildPublicMediaUrl(storageKey);

    console.log(`[VideoExport] Upload complete: ${storageKey} (${duration}s)`);

    return {
      videoUrl: publicUrl || videoUrl,
      storageKey,
      duration,
    };
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
