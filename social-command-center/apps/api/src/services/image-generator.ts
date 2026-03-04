import sharp from 'sharp';
import { uploadBuffer, generateMediaKey } from './s3.js';
import { randomUUID } from 'crypto';
import { getAI, getReplicate, isReplicateConfigured } from './ai-clients.js';

export { isReplicateConfigured };

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
  imageDataUrl: string;
  storageKey: string;
}

export interface QuoteCardResult {
  imageUrl: string;
  imageDataUrl: string;
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
- Image prompts should describe abstract, aesthetic, TEXTLESS backgrounds optimized for the Flux AI image model
- Image prompt structure: "[Style/Medium], [Primary Visual Element], [Color Palette], [Mood/Atmosphere], [Texture/Detail], [Lighting]"
- Example prompts: "Abstract digital art, smooth flowing gradient, deep navy blue transitioning to warm amber gold, ethereal sophisticated mood, soft bokeh light particles, dramatic volumetric lighting, 4K ultra high detail"
- Other examples: "Macro photography of dark textured marble surface with gold veining, luxurious moody aesthetic, dramatic low-key lighting", "Minimalist architectural photograph, sweeping curved concrete structure, brutalist aesthetic with warm golden hour lighting"
- IMPORTANT: Image prompts must NEVER include text, words, letters, or watermarks — the text is composited separately
- Use rich, descriptive prompts (30-60 words) — Flux responds well to detailed descriptions
- Prefer dark, moody backgrounds (dark navy, charcoal, deep teal, midnight purple) so white/light text overlays pop

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

  // Detect if the topic promises a specific number of items (e.g. "5 tips", "7 things")
  const numberMatch = topic.match(/\b(\d+)\s+(things?|tips?|facts?|reasons?|ways?|steps?|rules?|habits?|mistakes?|secrets?|lessons?|signs?|hacks?|ideas?|myths?|truths?|principles?|strategies?|techniques?|examples?|benefits?)\b/i);
  const promisedCount = numberMatch ? parseInt(numberMatch[1], 10) : null;

  // If the topic promises N items, ensure we have enough slides: N content + 1 hook + 1 CTA
  const effectiveSlideCount = promisedCount
    ? Math.max(slideCount, promisedCount + 2)
    : slideCount;

  // Calculate how many content slides we actually have (total - hook - CTA)
  const contentSlideCount = effectiveSlideCount - 2;

  const contentCountRule = promisedCount
    ? `\n\nCRITICAL RULE — CONTENT ACCURACY: The topic mentions "${numberMatch![0]}". You MUST include exactly ${promisedCount} content slides (slides 2 through ${promisedCount + 1}), each covering one distinct item. Slide 1 is the hook and slide ${promisedCount + 2} is the CTA. The hook slide's title should promise exactly ${promisedCount} items, and you must deliver all ${promisedCount}. Do NOT skip any. Do NOT combine multiple items into one slide. Every single one of the ${promisedCount} items must get its own dedicated slide.`
    : `\n\nCRITICAL RULE — NUMBER CONSISTENCY: You have ${contentSlideCount} content slides (slides 2 through ${effectiveSlideCount - 1}). If your hook slide mentions a number (e.g. "5 Tips", "7 Facts"), that number MUST exactly equal ${contentSlideCount} because that's how many content slides follow. Do NOT write "5 tips" in the hook if there are only ${contentSlideCount} content slides. The number in the hook MUST match the actual number of content slides you deliver. If the topic is general (e.g. "love tips"), write "${contentSlideCount} Love Tips" in the hook — not more, not less.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: CAROUSEL_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Design a ${effectiveSlideCount}-slide Instagram carousel.

Topic: ${topic}
Type: ${typeInstructions[contentType] || typeInstructions.carousel}
Tone: ${tone}
${contentCountRule}

Slide structure (${effectiveSlideCount} slides total):
- Slide 1: HOOK — attention-grabbing headline. If you mention a number here (e.g. "X Tips"), X MUST equal exactly ${contentSlideCount}.
- Slides 2 through ${effectiveSlideCount - 1}: CONTENT — exactly ${contentSlideCount} slides, each covering ONE distinct point/tip/fact/item. Number them clearly.
- Slide ${effectiveSlideCount}: CTA — call-to-action (save, follow, share, comment)

You MUST return exactly ${effectiveSlideCount} slides with exactly ${contentSlideCount} content slides between the hook and CTA.

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
 * Generate an image using Replicate Flux Schnell (fast, cheap, high quality).
 * Falls back to Sharp gradient backgrounds when Replicate is not configured.
 *
 * Model: black-forest-labs/flux-schnell
 * - ~$0.003/image (3.7x cheaper than SDXL)
 * - ~1-2s generation (5-10x faster than SDXL)
 * - Better default aesthetics for abstract backgrounds
 * - No negative prompts needed (Flux doesn't support them)
 */
async function generateImage(
  prompt: string,
  width: number = 1080,
  height: number = 1080,
): Promise<Buffer> {
  const replicate = getReplicate();

  if (replicate) {
    try {
      // Enhance the prompt for Flux — be descriptive, specific, and lead with style
      const enhancedPrompt = `${prompt}, professional quality, ultra high detail, no text, no words, no letters, no watermark, no logo`;

      const output = await replicate.run(
        'black-forest-labs/flux-schnell',
        {
          input: {
            prompt: enhancedPrompt,
            aspect_ratio: '1:1',
            num_outputs: 1,
            output_format: 'webp',
            output_quality: 90,
            go_fast: true,
            num_inference_steps: 4, // Schnell is optimized for exactly 4 steps
          },
        },
      );

      // Flux returns an array of URLs or FileOutput objects
      const imageResult = Array.isArray(output) ? output[0] : output;
      let buffer: Buffer;

      if (typeof imageResult === 'string') {
        const response = await fetch(imageResult);
        buffer = Buffer.from(await response.arrayBuffer());
      } else if (imageResult && typeof imageResult === 'object' && 'url' in (imageResult as any)) {
        const url = typeof (imageResult as any).url === 'function'
          ? (imageResult as any).url()
          : (imageResult as any).url;
        const response = await fetch(url);
        buffer = Buffer.from(await response.arrayBuffer());
      } else {
        const response = await fetch(imageResult as any);
        buffer = Buffer.from(await response.arrayBuffer());
      }

      // Resize to exact dimensions (Flux uses aspect_ratio, not pixel dimensions)
      return sharp(buffer).resize(width, height, { fit: 'cover' }).png().toBuffer();
    } catch (err) {
      console.error('[ImageGenerator] Replicate Flux failed, falling back to gradient:', err);
    }
  }

  // Fallback: generate a gradient background with Sharp
  return generateGradientBackground(width, height, prompt);
}

/**
 * Generate a professional gradient background with geometric accents.
 */
async function generateGradientBackground(
  width: number,
  height: number,
  _seed: string,
): Promise<Buffer> {
  let hash = 0;
  for (let i = 0; i < _seed.length; i++) {
    hash = (hash << 5) - hash + _seed.charCodeAt(i);
    hash |= 0;
  }

  // Professional palettes: dark, rich, high-contrast
  const palettes = [
    { bg: '#0f0f1a', g1: '#1a1a3e', g2: '#2d1b69', accent: '#8b5cf6' },
    { bg: '#0a0a0a', g1: '#1a0a2e', g2: '#0a2e1a', accent: '#22d3ee' },
    { bg: '#1a0505', g1: '#2d0a0a', g2: '#1a0a2e', accent: '#f43f5e' },
    { bg: '#050a1a', g1: '#0a1a3e', g2: '#0a2e3e', accent: '#3b82f6' },
    { bg: '#0a1a0a', g1: '#0a2e1a', g2: '#1a3e0a', accent: '#22c55e' },
    { bg: '#1a1a0a', g1: '#2e2e0a', g2: '#3e2e0a', accent: '#eab308' },
    { bg: '#1a0a1a', g1: '#2e0a2e', g2: '#3e0a2e', accent: '#ec4899' },
    { bg: '#0a0a1a', g1: '#0a1a3e', g2: '#2e0a3e', accent: '#a855f7' },
  ];

  const p = palettes[Math.abs(hash) % palettes.length];
  const variant = Math.abs(hash >> 4) % 4;

  // Geometric pattern elements based on variant
  let geometricElements = '';
  if (variant === 0) {
    // Diagonal lines
    for (let i = -width; i < width * 2; i += 120) {
      geometricElements += `<line x1="${i}" y1="0" x2="${i + width}" y2="${height}" stroke="${p.accent}" stroke-opacity="0.04" stroke-width="1"/>`;
    }
  } else if (variant === 1) {
    // Concentric circles
    for (let r = 100; r < width; r += 150) {
      geometricElements += `<circle cx="${width * 0.65}" cy="${height * 0.35}" r="${r}" fill="none" stroke="${p.accent}" stroke-opacity="0.03" stroke-width="1"/>`;
    }
  } else if (variant === 2) {
    // Dot grid
    for (let x = 40; x < width; x += 60) {
      for (let y = 40; y < height; y += 60) {
        geometricElements += `<circle cx="${x}" cy="${y}" r="1.5" fill="${p.accent}" opacity="0.06"/>`;
      }
    }
  } else {
    // Abstract blobs
    geometricElements += `
      <ellipse cx="${width * 0.75}" cy="${height * 0.2}" rx="${width * 0.35}" ry="${height * 0.25}" fill="${p.accent}" opacity="0.04"/>
      <ellipse cx="${width * 0.2}" cy="${height * 0.75}" rx="${width * 0.3}" ry="${height * 0.2}" fill="${p.accent}" opacity="0.03"/>
      <ellipse cx="${width * 0.5}" cy="${height * 0.5}" rx="${width * 0.15}" ry="${height * 0.4}" fill="${p.accent}" opacity="0.02" transform="rotate(30 ${width * 0.5} ${height * 0.5})"/>`;
  }

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rg1" cx="30%" cy="30%" r="70%">
          <stop offset="0%" style="stop-color:${p.g1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${p.bg};stop-opacity:1" />
        </radialGradient>
        <radialGradient id="rg2" cx="70%" cy="70%" r="60%">
          <stop offset="0%" style="stop-color:${p.g2};stop-opacity:0.6" />
          <stop offset="100%" style="stop-color:transparent;stop-opacity:0" />
        </radialGradient>
        <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${p.accent};stop-opacity:0" />
          <stop offset="50%" style="stop-color:${p.accent};stop-opacity:0.08" />
          <stop offset="100%" style="stop-color:${p.accent};stop-opacity:0" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="${p.bg}" />
      <rect width="${width}" height="${height}" fill="url(#rg1)" />
      <rect width="${width}" height="${height}" fill="url(#rg2)" />
      <rect width="${width}" height="${height}" fill="url(#shimmer)" />
      ${geometricElements}
      <rect width="${width}" height="${height}" fill="url(#rg1)" opacity="0.1"/>
    </svg>`;

  return sharp(Buffer.from(svg)).resize(width, height).png().toBuffer();
}

// ─── Text Compositing ────────────────────────────────────

const escXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

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

/**
 * Overlay title and body text onto a background image with professional styling.
 * Uses centered full-bleed layout for clean Instagram carousel look.
 */
async function compositeSlide(
  imageBuffer: Buffer,
  slide: SlidePlan,
  width: number = 1080,
  height: number = 1080,
): Promise<Buffer> {
  const { title, body, textColor } = slide;
  const tc = textColor || '#ffffff';

  // Determine accent color from slide's backgroundColor
  const accent = slide.backgroundColor || '#8b5cf6';

  // Adaptive font sizing based on text length
  const titleSize = title.length > 60 ? 44 : title.length > 40 ? 52 : title.length > 20 ? 60 : 72;
  const bodySize = body && body.length > 80 ? 24 : 28;
  const padding = 100;
  const maxTitleChars = Math.floor((width - padding * 2) / (titleSize * 0.52));
  const maxBodyChars = Math.floor((width - padding * 2) / (bodySize * 0.48));

  const titleLines = wrapText(title, maxTitleChars);
  const bodyLines = body ? wrapText(body, maxBodyChars) : [];

  const titleLineH = titleSize * 1.25;
  const bodyLineH = bodySize * 1.5;
  const titleBlockH = titleLines.length * titleLineH;
  const bodyBlockH = bodyLines.length * bodyLineH;
  const gap = bodyLines.length > 0 ? 32 : 0;
  const totalH = titleBlockH + gap + bodyBlockH;

  // Center everything vertically
  const startY = (height - totalH) / 2;

  // Accent bar above title
  const barY = startY - 40;

  // Build title SVG with text shadow for legibility
  const titleSvg = titleLines
    .map((line, i) => {
      const y = startY + titleLineH * (i + 0.85);
      // Shadow
      const shadow = `<text x="${width / 2 + 2}" y="${y + 2}" font-family="'Liberation Sans', 'DejaVu Sans', 'Noto Sans', sans-serif" font-size="${titleSize}" font-weight="900" fill="rgba(0,0,0,0.4)" text-anchor="middle" letter-spacing="-1">${escXml(line)}</text>`;
      // Main text
      const main = `<text x="${width / 2}" y="${y}" font-family="'Liberation Sans', 'DejaVu Sans', 'Noto Sans', sans-serif" font-size="${titleSize}" font-weight="900" fill="${escXml(tc)}" text-anchor="middle" letter-spacing="-1">${escXml(line)}</text>`;
      return shadow + '\n' + main;
    })
    .join('\n');

  // Build body SVG
  const bodyStartY = startY + titleBlockH + gap;
  const bodySvg = bodyLines
    .map((line, i) => {
      const y = bodyStartY + bodyLineH * (i + 0.85);
      const shadow = `<text x="${width / 2 + 1}" y="${y + 1}" font-family="'Liberation Sans', 'DejaVu Sans', 'Noto Sans', sans-serif" font-size="${bodySize}" font-weight="400" fill="rgba(0,0,0,0.3)" text-anchor="middle">${escXml(line)}</text>`;
      const main = `<text x="${width / 2}" y="${y}" font-family="'Liberation Sans', 'DejaVu Sans', 'Noto Sans', sans-serif" font-size="${bodySize}" font-weight="400" fill="${escXml(tc)}" opacity="0.85" text-anchor="middle">${escXml(line)}</text>`;
      return shadow + '\n' + main;
    })
    .join('\n');

  // Slide number indicator (bottom right)
  const slideNum = slide.slideNumber;
  const slideNumSvg = slideNum
    ? `<text x="${width - 60}" y="${height - 50}" font-family="'Liberation Sans', 'DejaVu Sans', 'Noto Sans', sans-serif" font-size="16" font-weight="700" fill="${escXml(tc)}" opacity="0.3" text-anchor="middle" letter-spacing="2">${String(slideNum).padStart(2, '0')}</text>`
    : '';

  const overlaySvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="overlay-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:rgba(0,0,0,0.2);stop-opacity:1" />
          <stop offset="40%" style="stop-color:rgba(0,0,0,0.05);stop-opacity:1" />
          <stop offset="60%" style="stop-color:rgba(0,0,0,0.05);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgba(0,0,0,0.2);stop-opacity:1" />
        </linearGradient>
      </defs>
      <!-- Subtle vignette overlay for text readability -->
      <rect width="${width}" height="${height}" fill="url(#overlay-grad)" />
      <!-- Accent bar -->
      <rect x="${width / 2 - 30}" y="${barY}" width="60" height="4" rx="2" fill="${escXml(accent)}" opacity="0.9"/>
      ${titleSvg}
      ${bodySvg}
      ${slideNumSvg}
    </svg>`;

  return sharp(imageBuffer)
    .resize(width, height, { fit: 'cover' })
    .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
    .png()
    .toBuffer();
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
    const imageDataUrl = `data:image/png;base64,${finalImage.toString('base64')}`;

    results.push({
      slideNumber: slide.slideNumber,
      title: slide.title,
      body: slide.body,
      imageUrl,
      imageDataUrl,
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
  const imageDataUrl = `data:image/png;base64,${finalImage.toString('base64')}`;

  return {
    slideNumber: slide.slideNumber,
    title: slide.title,
    body: slide.body,
    imageUrl,
    imageDataUrl,
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
        `<text x="${width / 2}" y="${startY + lineHeight * (i + 1)}" font-family="'Liberation Serif', 'DejaVu Serif', 'Noto Serif', serif" font-size="${quoteSize}" font-weight="400" font-style="italic" fill="${escXml(text)}" text-anchor="middle">${escXml(line)}</text>`,
    )
    .join('\n');

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${escXml(bg)}" />
      <text x="${width / 2}" y="${startY - 20}" font-family="'Liberation Serif', 'DejaVu Serif', 'Noto Serif', serif" font-size="120" fill="${escXml(accent)}" opacity="0.3" text-anchor="middle">\u201C</text>
      ${quoteSvgLines}
      <line x1="${width / 2 - 40}" y1="${startY + totalQuoteH + 30}" x2="${width / 2 + 40}" y2="${startY + totalQuoteH + 30}" stroke="${escXml(accent)}" stroke-width="3" />
      <text x="${width / 2}" y="${startY + totalQuoteH + 70}" font-family="'Liberation Sans', 'DejaVu Sans', 'Noto Sans', sans-serif" font-size="24" font-weight="700" fill="${escXml(text)}" opacity="0.7" text-anchor="middle" letter-spacing="3">${escXml(author.toUpperCase())}</text>
    </svg>`;

  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  const key = generateMediaKey(userId, `quote-card-${randomUUID().slice(0, 8)}.png`);
  const imageUrl = await uploadBuffer(key, buffer, 'image/png');
  const imageDataUrl = `data:image/png;base64,${buffer.toString('base64')}`;

  return { imageUrl, imageDataUrl, storageKey: key };
}
