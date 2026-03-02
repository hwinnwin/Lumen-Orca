import Anthropic from '@anthropic-ai/sdk';
import Replicate from 'replicate';
import sharp from 'sharp';
import { env } from '../config/env.js';
import { uploadBuffer, generateMediaKey } from './s3.js';
import { randomUUID } from 'crypto';

// ─── Clients ─────────────────────────────────────────────

let anthropicClient: Anthropic | null = null;
function getAI(): Anthropic {
  if (!anthropicClient) {
    if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not configured');
    anthropicClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

let replicateClient: Replicate | null = null;
function getReplicate(): Replicate | null {
  if (!env.REPLICATE_API_TOKEN) return null;
  if (!replicateClient) {
    replicateClient = new Replicate({ auth: env.REPLICATE_API_TOKEN });
  }
  return replicateClient;
}

export const isReplicateConfigured = Boolean(env.REPLICATE_API_TOKEN);

// ─── Types ───────────────────────────────────────────────

export interface SlidePlan {
  slideNumber: number;
  title: string;
  body: string;
  imagePrompt: string;
  backgroundColor: string;
  textColor: string;
}

export interface CarouselPlan {
  topic: string;
  caption: string;
  hashtags: string[];
  slides: SlidePlan[];
}

export interface GeneratedSlide {
  slideNumber: number;
  title: string;
  body: string;
  imageUrl: string;
  storageKey: string;
}

export interface QuoteCardResult {
  imageUrl: string;
  storageKey: string;
}

// ─── Carousel Planning (Claude) ──────────────────────────

const CAROUSEL_SYSTEM_PROMPT = `You are an elite creative director and marketing strategist who has designed viral carousel content for brands with millions of followers. You understand the psychology of scrolling behavior and design every slide to maximize saves, shares, and follows.

## Carousel Psychology (Based on Top-Performing Content)
- Instagram carousels get 1.4x more reach and 3.1x more engagement than single image posts
- Average swipe-through rate is 45% — your first slide must earn the swipe
- "Save" is the most valuable engagement signal to the algorithm — design save-worthy content
- Optimal carousel length: 7-10 slides for educational, 5-7 for storytelling, 3-5 for quotes

## Slide Architecture

### Slide 1 — THE HOOK (Make Them Stop Scrolling)
- This is your HEADLINE — it must create a curiosity gap or promise transformation
- Power formats: "X things [audience] gets wrong about [topic]", "The [topic] cheat sheet you didn't know you needed", "Stop doing [common mistake]. Do this instead.", "[Number] [topic] rules that changed everything"
- Use large, bold text. Minimal words. Maximum impact.
- Color psychology: Use high-contrast, attention-grabbing combos (dark bg + white/gold text, gradient bg + white text)

### Slides 2-N-1 — THE VALUE (Make Them Swipe)
- ONE idea per slide. If you need two sentences to explain it, it's too complex.
- Progressive disclosure: Each slide should reveal the next piece of the puzzle
- Use numbered formatting for listicles (people want to see all the numbers)
- Alternate visual layouts to maintain visual interest
- Include micro-hooks: "But here's what most people miss..." / "This next one is the game-changer..."

### Final Slide — THE CTA (Make Them Act)
- Clear, specific call-to-action: "Save this for when you need it", "Share with someone who needs to hear this", "Follow @handle for daily [topic]"
- Recap the value they just received
- Create FOMO: "I share content like this every day — don't miss the next one"

## Visual Design Principles
- Consistent color palette across all slides (brand coherence)
- High contrast between text and background (accessibility + readability)
- Clean, modern aesthetic — avoid cluttered designs
- Text hierarchy: Title is 2x the size of body text
- Leave breathing room — white space is your friend
- Image prompts should describe abstract, aesthetic, TEXTLESS backgrounds (moody gradients, architectural details, nature textures, geometric patterns, cinematic lighting)

## Caption Strategy
- The caption works WITH the carousel, not separate from it
- Open with a hook that teases the carousel content
- Add context and personality that the slides can't capture
- End with engagement question: "Which tip resonated most? Comment below"
- Hashtag strategy: Mix of niche (1K-50K posts), mid-range (50K-500K), and broad (500K+)`;

export async function planCarousel(
  topic: string,
  contentType: 'carousel' | 'quote-card' | 'mixed-media' | 'educational',
  slideCount: number,
  tone: string,
): Promise<CarouselPlan> {
  const client = getAI();

  const typeInstructions: Record<string, string> = {
    carousel: 'A text-overlay carousel where each slide has a bold headline and supporting text over a styled background image.',
    'quote-card': 'A collection of inspirational or thought-provoking quotes, each on a beautifully styled card.',
    'mixed-media': 'A carousel mixing photo-style images with text overlay slides for maximum visual variety.',
    educational: 'An educational listicle — numbered tips, steps, or facts. Each slide covers one point clearly.',
  };

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: CAROUSEL_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Design a ${slideCount}-slide Instagram carousel.

Topic: ${topic}
Type: ${typeInstructions[contentType] || typeInstructions.carousel}
Tone: ${tone}

For each slide provide:
- title: Bold headline (max 15 words)
- body: Supporting text (max 30 words, can be empty for hook slides)
- imagePrompt: Detailed prompt for an AI image generator to create the background (describe aesthetics, colors, mood — NO text in the image)
- backgroundColor: Hex color for text container overlay (e.g. "#1a1a2e")
- textColor: Hex color for text (e.g. "#ffffff")

Also provide:
- caption: The Instagram caption to go with this carousel (with line breaks, CTA, relevant emojis)
- hashtags: 10-15 relevant hashtags

Respond in JSON:
{
  "topic": "${topic}",
  "caption": "instagram caption here",
  "hashtags": ["hashtag1", "hashtag2"],
  "slides": [
    {
      "slideNumber": 1,
      "title": "Hook Title",
      "body": "Supporting text",
      "imagePrompt": "description for image generation",
      "backgroundColor": "#1a1a2e",
      "textColor": "#ffffff"
    }
  ]
}`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text);
    return {
      topic: parsed.topic || topic,
      caption: parsed.caption || '',
      hashtags: parsed.hashtags || [],
      slides: (parsed.slides || []).map((s: any, i: number) => ({
        slideNumber: s.slideNumber || i + 1,
        title: s.title || '',
        body: s.body || '',
        imagePrompt: s.imagePrompt || '',
        backgroundColor: s.backgroundColor || '#1a1a2e',
        textColor: s.textColor || '#ffffff',
      })),
    };
  } catch {
    throw new Error('Failed to parse carousel plan from AI response');
  }
}

// ─── Image Generation ────────────────────────────────────

/**
 * Generate an image using Replicate SDXL, or fall back to a Sharp gradient.
 */
async function generateImage(
  prompt: string,
  width: number = 1080,
  height: number = 1080,
): Promise<Buffer> {
  const replicate = getReplicate();

  if (replicate) {
    try {
      const output = await replicate.run(
        'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc',
        {
          input: {
            prompt,
            negative_prompt: 'text, watermark, logo, words, letters, blurry, low quality',
            width,
            height,
            num_outputs: 1,
            guidance_scale: 7.5,
            num_inference_steps: 25,
          },
        },
      );

      // Replicate returns an array of URLs (or ReadableStream)
      const imageUrl = Array.isArray(output) ? output[0] : output;

      if (typeof imageUrl === 'string') {
        const response = await fetch(imageUrl);
        return Buffer.from(await response.arrayBuffer());
      } else if (imageUrl && typeof imageUrl === 'object' && 'url' in (imageUrl as any)) {
        const response = await fetch((imageUrl as any).url());
        return Buffer.from(await response.arrayBuffer());
      }

      // If it's a ReadableStream or other format, try to consume it
      const response = await fetch(imageUrl as any);
      return Buffer.from(await response.arrayBuffer());
    } catch (err) {
      console.error('[ImageGenerator] Replicate failed, falling back to gradient:', err);
    }
  }

  // Fallback: generate a gradient background with Sharp
  return generateGradientBackground(width, height, prompt);
}

/**
 * Generate a gradient background image as fallback when Replicate is not available.
 */
async function generateGradientBackground(
  width: number,
  height: number,
  _seed: string,
): Promise<Buffer> {
  // Use a hash of the seed string to pick gradient colors
  let hash = 0;
  for (let i = 0; i < _seed.length; i++) {
    hash = (hash << 5) - hash + _seed.charCodeAt(i);
    hash |= 0;
  }

  const gradients = [
    { from: '#667eea', to: '#764ba2' },
    { from: '#f093fb', to: '#f5576c' },
    { from: '#4facfe', to: '#00f2fe' },
    { from: '#43e97b', to: '#38f9d7' },
    { from: '#fa709a', to: '#fee140' },
    { from: '#a18cd1', to: '#fbc2eb' },
    { from: '#fccb90', to: '#d57eeb' },
    { from: '#e0c3fc', to: '#8ec5fc' },
    { from: '#f5576c', to: '#ff9a9e' },
    { from: '#667eea', to: '#38f9d7' },
  ];

  const gradient = gradients[Math.abs(hash) % gradients.length];

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${gradient.from};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${gradient.to};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#g)" />
      <circle cx="${width * 0.7}" cy="${height * 0.3}" r="${width * 0.25}" fill="rgba(255,255,255,0.05)" />
      <circle cx="${width * 0.2}" cy="${height * 0.8}" r="${width * 0.2}" fill="rgba(0,0,0,0.05)" />
    </svg>`;

  return sharp(Buffer.from(svg)).resize(width, height).png().toBuffer();
}

// ─── Text Compositing ────────────────────────────────────

/**
 * Overlay title and body text onto a background image.
 */
async function compositeSlide(
  imageBuffer: Buffer,
  slide: SlidePlan,
  width: number = 1080,
  height: number = 1080,
): Promise<Buffer> {
  const { title, body, backgroundColor, textColor } = slide;

  // Escape XML special characters
  const escXml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const titleSize = title.length > 40 ? 48 : title.length > 25 ? 56 : 64;
  const bodySize = 28;
  const padding = 80;
  const titleLines = wrapText(title, Math.floor((width - padding * 2) / (titleSize * 0.55)));
  const bodyLines = body ? wrapText(body, Math.floor((width - padding * 2) / (bodySize * 0.5))) : [];

  const lineHeight = titleSize * 1.3;
  const bodyLineHeight = bodySize * 1.4;
  const totalTextHeight =
    titleLines.length * lineHeight + (bodyLines.length > 0 ? 24 + bodyLines.length * bodyLineHeight : 0);

  const boxHeight = totalTextHeight + padding * 2;
  const boxY = height - boxHeight - 60;

  const titleSvgLines = titleLines
    .map(
      (line, i) =>
        `<text x="${width / 2}" y="${boxY + padding + lineHeight * (i + 0.8)}" font-family="Arial, Helvetica, sans-serif" font-size="${titleSize}" font-weight="800" fill="${escXml(textColor)}" text-anchor="middle">${escXml(line)}</text>`,
    )
    .join('\n');

  const bodyStartY = boxY + padding + titleLines.length * lineHeight + 24;
  const bodySvgLines = bodyLines
    .map(
      (line, i) =>
        `<text x="${width / 2}" y="${bodyStartY + bodyLineHeight * (i + 0.8)}" font-family="Arial, Helvetica, sans-serif" font-size="${bodySize}" font-weight="400" fill="${escXml(textColor)}" opacity="0.85" text-anchor="middle">${escXml(line)}</text>`,
    )
    .join('\n');

  const overlaySvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="${boxY}" width="${width}" height="${boxHeight + 60}" fill="${escXml(backgroundColor)}" opacity="0.85" rx="0" />
      ${titleSvgLines}
      ${bodySvgLines}
    </svg>`;

  return sharp(imageBuffer)
    .resize(width, height, { fit: 'cover' })
    .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
    .png()
    .toBuffer();
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  if (maxCharsPerLine < 1) maxCharsPerLine = 20;
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (current.length + word.length + 1 > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ─── Full Carousel Generation ────────────────────────────

/**
 * Generate a complete carousel: plan → images → composited slides → stored.
 */
export async function generateCarousel(
  plan: CarouselPlan,
  userId: string,
): Promise<GeneratedSlide[]> {
  const results: GeneratedSlide[] = [];

  for (const slide of plan.slides) {
    // Generate background image
    const bgImage = await generateImage(slide.imagePrompt, 1080, 1080);

    // Composite text overlay
    const finalImage = await compositeSlide(bgImage, slide, 1080, 1080);

    // Upload to storage
    const key = generateMediaKey(userId, `carousel-slide-${slide.slideNumber}.png`);
    const imageUrl = await uploadBuffer(key, finalImage, 'image/png');

    results.push({
      slideNumber: slide.slideNumber,
      title: slide.title,
      body: slide.body,
      imageUrl,
      storageKey: key,
    });
  }

  return results;
}

/**
 * Regenerate a single slide from its plan.
 */
export async function regenerateSlide(
  slide: SlidePlan,
  userId: string,
): Promise<GeneratedSlide> {
  const bgImage = await generateImage(slide.imagePrompt, 1080, 1080);
  const finalImage = await compositeSlide(bgImage, slide, 1080, 1080);
  const key = generateMediaKey(userId, `carousel-slide-${slide.slideNumber}.png`);
  const imageUrl = await uploadBuffer(key, finalImage, 'image/png');

  return {
    slideNumber: slide.slideNumber,
    title: slide.title,
    body: slide.body,
    imageUrl,
    storageKey: key,
  };
}

// ─── Quote Card Generation ───────────────────────────────

export async function generateQuoteCard(
  quote: string,
  author: string,
  style: { backgroundColor?: string; textColor?: string; accentColor?: string } = {},
  userId: string,
): Promise<QuoteCardResult> {
  const width = 1080;
  const height = 1080;
  const bg = style.backgroundColor || '#1a1a2e';
  const text = style.textColor || '#ffffff';
  const accent = style.accentColor || '#8b5cf6';

  const escXml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const quoteSize = quote.length > 120 ? 36 : quote.length > 80 ? 44 : 52;
  const quoteLines = wrapText(quote, Math.floor((width - 160) / (quoteSize * 0.5)));
  const lineHeight = quoteSize * 1.5;
  const totalQuoteH = quoteLines.length * lineHeight;
  const startY = (height - totalQuoteH - 80) / 2;

  const quoteSvgLines = quoteLines
    .map(
      (line, i) =>
        `<text x="${width / 2}" y="${startY + lineHeight * (i + 1)}" font-family="Georgia, 'Times New Roman', serif" font-size="${quoteSize}" font-weight="400" font-style="italic" fill="${escXml(text)}" text-anchor="middle">${escXml(line)}</text>`,
    )
    .join('\n');

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${escXml(bg)}" />
      <text x="${width / 2}" y="${startY - 20}" font-family="Georgia, serif" font-size="120" fill="${escXml(accent)}" opacity="0.3" text-anchor="middle">\u201C</text>
      ${quoteSvgLines}
      <line x1="${width / 2 - 40}" y1="${startY + totalQuoteH + 30}" x2="${width / 2 + 40}" y2="${startY + totalQuoteH + 30}" stroke="${escXml(accent)}" stroke-width="3" />
      <text x="${width / 2}" y="${startY + totalQuoteH + 70}" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="${escXml(text)}" opacity="0.7" text-anchor="middle" letter-spacing="3">${escXml(author.toUpperCase())}</text>
    </svg>`;

  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  const key = generateMediaKey(userId, `quote-card-${randomUUID().slice(0, 8)}.png`);
  const imageUrl = await uploadBuffer(key, buffer, 'image/png');

  return { imageUrl, storageKey: key };
}
