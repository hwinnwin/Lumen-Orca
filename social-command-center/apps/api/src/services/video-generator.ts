import { getAI, getReplicate, isReplicateConfigured } from './ai-clients.js';
import { uploadBuffer, generateMediaKey } from './s3.js';

export { isReplicateConfigured };

// ─── Types ───────────────────────────────────────────────

export interface VideoPlan {
  prompt: string;
  caption: string;
  hashtags: string[];
  duration: number;
  aspectRatio: string;
  platform: string;
}

export interface GeneratedVideo {
  videoUrl: string;
  storageKey: string;
  duration: number;
}

export type VideoPlatform = 'reels' | 'tiktok' | 'shorts';

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

## Caption Strategy for Short-Form Video
- Hook in the first line (question, bold statement, or curiosity gap)
- Keep it conversational and punchy — not essay-length
- End with a CTA: "Follow for more", "Save this", "Tag someone who needs this"
- Hashtags: mix niche + broad, 5-10 total`;

export async function planVideo(
  topic: string,
  platform: VideoPlatform,
  tone: string,
): Promise<VideoPlan> {
  const client = getAI();
  const config = PLATFORM_CONFIG[platform];

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: VIDEO_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Create a short-form video concept for ${config.label}.

Topic: ${topic}
Tone: ${tone}
Aspect ratio: ${config.aspectRatio} (vertical)
Duration: 6 seconds

Provide:
1. A detailed video generation prompt (50-80 words) describing the visual scene, camera movement, lighting, and atmosphere. This will be sent to an AI video model, so be descriptive and cinematic.
2. A social media caption optimized for ${config.label}
3. 5-10 relevant hashtags

Respond in JSON:
{
  "prompt": "detailed video generation prompt here",
  "caption": "social media caption here",
  "hashtags": ["hashtag1", "hashtag2"]
}`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text);

    return {
      prompt: parsed.prompt || topic,
      caption: parsed.caption || '',
      hashtags: parsed.hashtags || [],
      duration: 6,
      aspectRatio: config.aspectRatio,
      platform,
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

  // Hailuo returns a URL to the generated .mp4
  let videoUrl: string;
  if (typeof output === 'string') {
    videoUrl = output;
  } else if (Array.isArray(output)) {
    videoUrl = typeof output[0] === 'string' ? output[0] : (output[0] as any)?.url?.() || (output[0] as any)?.url || String(output[0]);
  } else if (output && typeof output === 'object' && 'url' in (output as any)) {
    const u = (output as any).url;
    videoUrl = typeof u === 'function' ? u() : u;
  } else {
    videoUrl = String(output);
  }

  console.log(`[VideoGenerator] Replicate returned video URL: ${videoUrl.substring(0, 80)}...`);

  // Download the video
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Failed to download generated video: ${response.status}`);
  }
  const videoBuffer = Buffer.from(await response.arrayBuffer());

  console.log(`[VideoGenerator] Downloaded video: ${(videoBuffer.length / 1024 / 1024).toFixed(1)}MB`);

  // Upload to storage
  const key = generateMediaKey(userId, `generated-video-${Date.now()}.mp4`);
  const storedUrl = await uploadBuffer(key, videoBuffer, 'video/mp4');

  return {
    videoUrl: storedUrl,
    storageKey: key,
    duration,
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
