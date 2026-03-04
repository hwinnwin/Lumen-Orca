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
    audioInstructions.push(`4. A voiceover narration script that fits ~${totalDuration} seconds when read at a natural pace. Write it as a continuous script, not per-segment. Make it conversational and engaging.`);
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

/**
 * Generate voiceover using MiniMax Speech-02-HD.
 * Returns an audio buffer (MP3).
 */
export async function generateVoiceover(
  script: string,
): Promise<Buffer> {
  const replicate = getReplicate();
  if (!replicate) throw new Error('Voiceover generation requires REPLICATE_API_TOKEN.');

  console.log(`[VideoGenerator] Generating voiceover (${script.length} chars)`);

  const output = await replicate.run(
    'minimax/speech-02-hd' as `${string}/${string}`,
    {
      input: {
        text: script,
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
      const reader = (obj as ReadableStream<Uint8Array>).getReader();
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

// ─── FFmpeg Stitching ────────────────────────────────────

/**
 * Stitch multiple video segments together, optionally adding music and voiceover.
 * Uses ffmpeg CLI via child_process.
 *
 * Pipeline:
 * 1. Concatenate video segments into one MP4
 * 2. If music + voiceover: mix them (music at 30% volume when voiceover present)
 * 3. Merge audio onto the concatenated video
 */
export async function stitchVideo(
  videoBuffers: Buffer[],
  musicBuffer?: Buffer,
  voiceoverBuffer?: Buffer,
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

    // If no audio, return the concatenated video
    if (!musicBuffer && !voiceoverBuffer) {
      return await readFile(currentVideoPath);
    }

    // Write audio files
    let audioPath: string | undefined;

    if (musicBuffer && voiceoverBuffer) {
      const musicPath = join(tmpDir, 'music.wav');
      const voiceoverPath = join(tmpDir, 'voiceover.mp3');
      audioPath = join(tmpDir, 'mixed_audio.aac');

      await writeFile(musicPath, musicBuffer);
      await writeFile(voiceoverPath, voiceoverBuffer);

      // Mix music (at 30% volume) + voiceover into one audio track
      await execFileAsync('ffmpeg', [
        '-y',
        '-stream_loop', '-1', '-i', musicPath,
        '-i', voiceoverPath,
        '-filter_complex', '[0:a]volume=0.3[music];[1:a]volume=1.0[voice];[music][voice]amix=inputs=2:duration=longest[out]',
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
      const voiceoverPath = join(tmpDir, 'voiceover.mp3');
      audioPath = join(tmpDir, 'audio.aac');
      await writeFile(voiceoverPath, voiceoverBuffer);

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
    musicStyle?: string;
  },
  userId: string,
): Promise<GeneratedVideo> {
  const { segments, aspectRatio = '9:16', voiceoverScript, musicStyle } = params;

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
    voiceoverScript ? generateVoiceover(voiceoverScript).catch((err) => {
      console.warn(`[VideoGenerator] Voiceover generation failed, continuing without:`, err);
      return undefined;
    }) : undefined,
  ]);

  // Stitch everything together
  const finalBuffer = await stitchVideo(videoBuffers, musicBuffer, voiceoverBuffer);
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
