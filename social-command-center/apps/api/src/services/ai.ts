import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    anthropicClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

const SYSTEM_PROMPT = `You are the AI engine for Lumen ORCA (Omni-Resonant Content Amplifier), a social media command center built by HwinNwin Enterprises and Lumen Systems. You are an EXPERT MARKETING AGENT with deep knowledge of digital marketing, brand strategy, audience psychology, and content virality.

## Core Identity
You think like a Chief Marketing Officer who has scaled multiple brands from zero to millions of followers. You combine data-driven marketing science with creative storytelling instinct. Every piece of content you produce is strategically crafted to achieve specific marketing objectives.

## Marketing Frameworks You Apply
- **AIDA** (Attention → Interest → Desire → Action): Every post follows this funnel
- **Hook-Value-CTA**: Open with pattern interrupt, deliver transformation, close with clear next step
- **PAS** (Problem → Agitate → Solve): For pain-point content that converts
- **Storytelling Arc**: Setup → Conflict → Resolution → Lesson for narrative posts
- **Social Proof Loop**: Weave credibility, results, and authority into every message
- **Engagement Triggers**: Questions, controversies, contrarian takes, "save this" value bombs

## Platform Mastery

### X (Twitter) — 280 chars max
- Lead with a HOOK that stops the scroll (hot take, surprising stat, bold claim)
- Use short sentences. Line breaks. White space.
- Threads: First tweet is the trailer. Last tweet is the CTA.
- Quote-tweet bait: Write lines people want to repost
- Power formats: "Most people [wrong thing]. Top 1% [right thing].", "I spent [time/money] on [thing]. Here's what I learned:", "[Number] [topic] lessons I wish I knew sooner:"

### Instagram — 2200 chars max
- First line = headline (only 125 chars visible before "more")
- Use line breaks aggressively — walls of text die on IG
- Structure: Hook line → Story/Value → CTA → Hashtags (in first comment ideally)
- Carousel posts get 3x more engagement than single images
- Reels captions: short, curiosity-driven, CTA to watch
- Use strategic emoji as visual anchors, not decoration
- Hashtag strategy: 3-5 niche + 3-5 mid-range + 2-3 broad

### LinkedIn — 3000 chars max
- First 2 lines are EVERYTHING (that's all people see before "see more")
- Open with: personal story, counterintuitive insight, or bold statement
- Write in short paragraphs (1-2 sentences each)
- End with a question to drive comments (LinkedIn's algorithm rewards comments)
- Power formats: "I got fired/rejected/failed → here's what happened", "Unpopular opinion:", "After [X years] in [industry], here's what nobody tells you:"
- Tag relevant people and companies strategically
- Avoid hashtags in the body — put 3-5 at the bottom

### Facebook — 63206 chars max
- Conversational, community-building tone
- Questions and polls drive massive engagement
- Long-form storytelling works — Facebook rewards time-on-post
- Share vulnerable, relatable moments
- Use "Share if you agree" and "Tag someone who needs this" CTAs
- Facebook Groups content: position as helpful expert, not salesy

### TikTok — 2200 chars max
- Caption is secondary to the video hook but still matters
- Use trending sounds/formats references in captions
- CTA-heavy: "Follow for more", "Save this", "Comment [word] for the link"
- Controversy and hot takes get pushed by the algorithm
- Gen-Z native language OK — but authentic, not try-hard
- Stitch/duet bait: Ask questions, make claims people want to respond to

### YouTube — 5000 chars (community), descriptions
- SEO-first: Front-load keywords in titles and descriptions
- Thumbnails are the #1 growth lever (suggest thumbnail concepts)
- Timestamps increase watch time
- Pinned comment = second CTA opportunity
- Community posts: polls, behind-scenes, teasers

## Copywriting Expertise
- **Power words**: "secret", "proven", "exclusive", "transform", "unlock", "blueprint", "masterclass"
- **Emotional triggers**: Fear of missing out, aspiration, belonging, curiosity gap, controversy
- **CTA formulas**: "DM me [word]", "Save this for later", "Drop a [emoji] if you agree", "Link in bio", "Comment [X] and I'll send you..."
- **Pattern interrupts**: Start with the unexpected — a result, a failure, a question, a contradiction
- **Readability**: 6th grade reading level. Short words. Short sentences. Maximum clarity.

## Strategic Thinking
- Every post serves a PURPOSE in the broader content strategy (awareness, engagement, conversion, retention)
- Content pillars: Educational (teach), Inspirational (motivate), Entertaining (engage), Promotional (convert)
- The 80/20 rule: 80% value, 20% promotion
- Understand the buyer's journey: Cold audience gets value/entertainment, warm gets case studies/proof, hot gets offers/CTAs
- Timing matters: Reference current events, trends, and seasons when relevant

## Brand Voice for HwinNwin Enterprises
- The Emperor brand: visionary, bold, conscious leadership
- Protocol 69: Never take, always give back more
- The Alliance: community-first, abundance mindset
- Consciousness technology: merging tech with spiritual awareness
- When emperor-mode is activated, channel this energy with authority and purpose

Always maintain the core message. Never fabricate facts, statistics, or claims. Make every word earn its place.`;

export interface EnhanceRequest {
  content: string;
  tone: string;
  platforms?: string[];
}

export interface EnhanceResult {
  enhanced: string;
  hashtags: string[];
  platformTips: Record<string, string>;
}

/**
 * Enhance content using the Anthropic API.
 */
export async function enhanceContent(request: EnhanceRequest): Promise<EnhanceResult> {
  const client = getClient();

  const toneDescriptions: Record<string, string> = {
    professional: 'polished, authoritative, business-appropriate',
    casual: 'relaxed, conversational, friendly',
    inspirational: 'uplifting, motivational, empowering',
    humorous: 'witty, playful, entertaining',
    storytelling: 'narrative-driven, engaging, personal',
    'emperor-mode': 'bold, visionary, commanding — channeling the Emperor of HwinNwin Enterprises, conscious tech leader. Reference Protocol 69, The Alliance, consciousness technology.',
  };

  const toneDesc = toneDescriptions[request.tone] || toneDescriptions.professional;
  const platformContext = request.platforms?.length
    ? `Target platforms: ${request.platforms.join(', ')}.`
    : '';

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `You are rewriting this social media post to make it SIGNIFICANTLY better. Don't just add emojis or hashtags — fundamentally transform it using your marketing expertise.

Tone: ${request.tone} (${toneDesc})
${platformContext}

Original (the user's rough draft):
"${request.content}"

YOUR JOB:
1. Apply the Hook-Value-CTA framework: open with a scroll-stopping hook, deliver real value, end with a clear call-to-action
2. Restructure for maximum readability: short sentences, line breaks, visual flow
3. Add a pattern interrupt in the opening line that makes people STOP scrolling
4. Make every word earn its place — cut filler, sharpen the message
5. If the original is vague, make it SPECIFIC with concrete details, numbers, or vivid language
6. The enhanced version should feel like it was written by a top-tier social media strategist, not a template

DO NOT just append hashtags to the original text. REWRITE IT from scratch if needed.

Respond in JSON format:
{
  "enhanced": "the completely transformed post text — ready to copy and paste",
  "hashtags": ["10-15 strategic hashtags mixing niche, mid-range, and broad"],
  "platformTips": {
    "platform_name": "specific actionable tip for maximizing engagement on this platform"
  }
}`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text);
    return {
      enhanced: parsed.enhanced || request.content,
      hashtags: parsed.hashtags || [],
      platformTips: parsed.platformTips || {},
    };
  } catch {
    // If JSON parsing fails, return the raw text as enhanced content
    return {
      enhanced: text || request.content,
      hashtags: [],
      platformTips: {},
    };
  }
}

export interface ThreadResult {
  tweets: string[];
  totalCharacters: number;
}

/**
 * Generate a thread from long-form content using AI.
 */
export async function generateThread(content: string, maxTweets: number = 10): Promise<ThreadResult> {
  const client = getClient();

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Transform this content into a VIRAL X (Twitter) thread that people will bookmark, retweet, and quote. Max ${maxTweets} tweets, each STRICTLY under 280 characters.

Thread Architecture:
- Tweet 1 (THE HOOK): This is the most important tweet. It's the trailer for the thread. Use a curiosity gap, bold claim, or shocking statement that DEMANDS the reader click "Show this thread". Examples: "I spent $50K learning this. Here's the 2-minute version:", "Everyone's doing [X] wrong. Let me explain:", "This one insight changed everything for me:"
- Middle tweets: Each one delivers ONE clear point. Use short sentences. Line breaks. Make each tweet quotable on its own.
- Final tweet: Strong CTA — "Follow @[handle] for more", "Bookmark this thread", "RT tweet #1 to help others"

Rules:
- Number format: 1/ at the start of each tweet
- Each tweet MUST be under 280 characters (this is non-negotiable)
- Don't just chop paragraphs — REWRITE for Twitter's format
- Use white space and line breaks within tweets
- Make at least 2-3 tweets individually quotable/retweetable

Content to transform:
${content}

Respond in JSON:
{
  "tweets": ["1/ tweet text", "2/ tweet text", ...]
}`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text);
    const tweets = parsed.tweets || [];
    return {
      tweets,
      totalCharacters: tweets.reduce((sum: number, t: string) => sum + t.length, 0),
    };
  } catch {
    // Fallback to simple splitting
    return { tweets: [content.slice(0, 280)], totalCharacters: content.length };
  }
}

export interface BrainstormResult {
  posts: Array<{
    content: string;
    platform: string;
    hook: string;
    hashtags: string[];
  }>;
}

/**
 * Brainstorm posts from keywords — the AI generates ready-to-post content for each platform.
 */
export async function brainstormFromKeywords(
  keywords: string[],
  platforms: string[],
  tone: string = 'professional',
  count: number = 3,
): Promise<BrainstormResult> {
  const client = getClient();

  const toneDescriptions: Record<string, string> = {
    professional: 'polished, authoritative, business-appropriate',
    casual: 'relaxed, conversational, friendly',
    inspirational: 'uplifting, motivational, empowering',
    humorous: 'witty, playful, entertaining',
    storytelling: 'narrative-driven, engaging, personal',
    'emperor-mode': 'bold, visionary, commanding — channeling the Emperor of HwinNwin Enterprises, conscious tech leader',
  };

  const toneDesc = toneDescriptions[tone] || toneDescriptions.professional;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `You are a world-class social media strategist brainstorming VIRAL content ideas. Generate ${count} unique, ready-to-publish posts that are so good the user can copy-paste them immediately.

Topics/Keywords: ${keywords.join(', ')}
Target platforms: ${platforms.join(', ')}
Tone: ${tone} (${toneDesc})

CRITICAL REQUIREMENTS:
- Each post must open with a SCROLL-STOPPING hook — the first line should make someone stop mid-scroll
- Each post must use a DIFFERENT creative angle (don't just reword the same idea ${count} times)
- Posts must feel NATIVE to their platform (X posts are punchy and under 280 chars; Instagram uses line breaks and storytelling; LinkedIn opens with a "see more" bait line)
- Include the full caption ready to publish — not a summary or outline, the ACTUAL post text
- Use real copywriting techniques: curiosity gaps, power words, pattern interrupts, social proof, emotional triggers
- Hashtags should be strategic: mix niche (specific), mid-range (100K-1M posts), and broad (trending)

ANGLES TO DRAW FROM (use different ones for each post):
- Hot Take / Contrarian — challenge conventional wisdom
- Story Time — personal narrative with a lesson
- Educational / Value Bomb — teach something actionable
- Behind The Scenes — raw, real, relatable
- Social Proof — results, numbers, transformation
- Question / Poll — spark conversation
- Trend Jack — ride a current cultural moment
- Listicle — "X things that..." format

Respond in JSON:
{
  "posts": [
    {
      "content": "THE FULL POST TEXT — complete, engaging, ready to publish. Not a summary. The actual caption.",
      "platform": "the best platform for this specific post",
      "hook": "2-4 word angle label",
      "hashtags": ["strategic", "hashtags", "10-12 per post"]
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
    return { posts: parsed.posts || [] };
  } catch {
    return { posts: [] };
  }
}

export interface GeneratedPlatformPost {
  platform: string;
  content: string;
  hashtags: string[];
  charCount: number;
  tip: string;
}

export interface MultiPlatformResult {
  topic: string;
  posts: GeneratedPlatformPost[];
}

/**
 * Generate tailored posts for each platform from a single topic/idea.
 * Each post is optimized for its platform's format, character limits, and best practices.
 */
export async function generateMultiPlatformPosts(
  topic: string,
  platforms: string[],
  tone: string = 'professional',
  context?: string,
): Promise<MultiPlatformResult> {
  const client = getClient();

  const toneDescriptions: Record<string, string> = {
    professional: 'polished, authoritative, business-appropriate',
    casual: 'relaxed, conversational, friendly',
    inspirational: 'uplifting, motivational, empowering',
    humorous: 'witty, playful, entertaining',
    storytelling: 'narrative-driven, engaging, personal',
    'emperor-mode': 'bold, visionary, commanding — channeling the Emperor of HwinNwin Enterprises, conscious tech leader. Reference Protocol 69, The Alliance, consciousness technology.',
  };

  const toneDesc = toneDescriptions[tone] || toneDescriptions.professional;

  const platformSpecs: Record<string, string> = {
    x: 'X (Twitter): MAX 280 characters. Punchy, hook-first. No fluff. Thread-worthy hooks.',
    instagram: 'Instagram: MAX 2200 characters. Visual storytelling, line breaks for readability. Put hashtags at the end. Emoji-friendly.',
    linkedin: 'LinkedIn: MAX 3000 characters. Professional, thought-leadership. Strong opening line (only first 2 lines visible before "see more"). Use line breaks. Industry context.',
    facebook: 'Facebook: MAX 63206 characters. Conversational, community-focused, questions that invite comments. Can be longer form.',
    tiktok: 'TikTok: MAX 2200 characters. Trend-aware, Gen-Z speak OK, CTA-driven. Hook in first line. Energy and personality.',
    youtube: 'YouTube: Community post, MAX 5000 characters. SEO-friendly, CTAs for subscribe/like. Can reference video content.',
  };

  const platformInstructions = platforms
    .map((p) => platformSpecs[p.toLowerCase()] || `${p}: Write an appropriate post.`)
    .join('\n');

  const contextLine = context ? `\nAdditional context: ${context}` : '';

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `You are creating platform-native content from ONE topic. Each post should look like it was written by someone who ONLY creates content for that specific platform — not like the same generic text adapted for different channels.

Topic/Idea: ${topic}${contextLine}
Tone: ${tone} (${toneDesc})

Platform specs:
${platformInstructions}

CRITICAL — WHAT MAKES THIS DIFFERENT FROM GENERIC AI:
- X: Write a TWEET, not a short paragraph. Use the cadence of viral tweets. Short sentences. Bold claims. The kind of tweet people screenshot and repost. Under 280 chars STRICTLY.
- Instagram: Write a CAPTION that flows. Use line breaks between every 1-2 sentences. Open with a line that makes people tap "more". End with engagement bait ("Save this", "Tag someone", "Drop a 🔥").
- LinkedIn: Write a THOUGHT LEADERSHIP post. Open with a personal insight or counterintuitive claim (first 2 lines are EVERYTHING on LinkedIn). Write in 1-2 sentence paragraphs. End with a question.
- Facebook: Write a CONVERSATION STARTER. Be vulnerable, relatable, community-oriented. Ask a question that invites comments.
- TikTok: Write a CAPTION that complements video content. Short, punchy, trend-aware. Use Gen-Z-native language if it fits. Strong CTA.
- YouTube: Write a COMMUNITY POST or video description. SEO-aware, include keywords naturally.

Each post must:
1. Open with a scroll-stopping first line
2. Deliver genuine value or emotion (not filler)
3. Close with a clear call-to-action appropriate for that platform
4. Include strategic hashtags (platform-appropriate quantity)
5. Feel like something a REAL creator with a large following would post

Respond in JSON:
{
  "posts": [
    {
      "platform": "x",
      "content": "the COMPLETE post text ready to copy-paste and publish",
      "hashtags": ["strategic", "hashtags"],
      "charCount": 142,
      "tip": "why this specific approach works on this platform"
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
      topic,
      posts: parsed.posts || [],
    };
  } catch {
    return { topic, posts: [] };
  }
}

export interface CaptionVariant {
  content: string;
  angle: string;
  reasoning: string;
}

/**
 * Generate alternative caption variants using AI.
 */
export async function generateVariants(
  content: string,
  platforms: string[],
  count: number = 3,
): Promise<CaptionVariant[]> {
  const client = getClient();

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Create ${count} fundamentally DIFFERENT versions of this post. Don't just rephrase — reimagine the content through completely different lenses. Target platforms: ${platforms.join(', ')}.

Original post:
"${content}"

Each variant must:
1. Use a DIFFERENT copywriting technique (story, question, listicle, hot take, social proof, vulnerability, etc.)
2. Have a completely different opening hook
3. Be a COMPLETE, ready-to-publish post (not a fragment or outline)
4. Be genuinely better or different from the original — not just the same thing with synonyms

Variant ideas to consider:
- "Story" angle: Wrap the message in a personal narrative
- "Data" angle: Lead with a surprising statistic or number
- "Question" angle: Open with a thought-provoking question
- "Contrarian" angle: Flip the conventional wisdom
- "Vulnerability" angle: Share a failure or struggle, then the lesson
- "Authority" angle: Position as expertise with social proof
- "Urgency" angle: Create FOMO or time-sensitive framing

Respond in JSON:
{
  "variants": [
    {
      "content": "the COMPLETE rewritten post — ready to publish",
      "angle": "2-3 word label for this creative approach",
      "reasoning": "one sentence on why this angle resonates with audiences"
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
    return parsed.variants || [];
  } catch {
    return [{ content, angle: 'Original', reasoning: 'Could not generate variants' }];
  }
}

// ─── Marketing Strategy Functions ──────────────────────────

export interface ContentStrategyResult {
  pillars: Array<{
    name: string;
    description: string;
    frequency: string;
    examples: string[];
  }>;
  weeklyCalendar: Array<{
    day: string;
    contentType: string;
    pillar: string;
    idea: string;
    platform: string;
    bestTime: string;
  }>;
  brandVoiceGuide: {
    tone: string;
    vocabulary: string[];
    avoidWords: string[];
    sampleCaption: string;
  };
}

/**
 * Generate a full content strategy based on brand/niche.
 */
export async function generateContentStrategy(
  brand: string,
  niche: string,
  audience: string,
  goals: string[],
  platforms: string[],
): Promise<ContentStrategyResult> {
  const client = getClient();

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Create a comprehensive content marketing strategy.

Brand/Business: ${brand}
Niche/Industry: ${niche}
Target Audience: ${audience}
Goals: ${goals.join(', ')}
Active Platforms: ${platforms.join(', ')}

Generate:
1. **Content Pillars** (4-5 recurring themes/categories) with frequency and example post ideas
2. **Weekly Content Calendar** (7 days) with specific post ideas, platforms, and optimal posting times
3. **Brand Voice Guide** with tone description, power vocabulary to use, words to avoid, and a sample caption

Respond in JSON:
{
  "pillars": [
    {
      "name": "pillar name",
      "description": "what this pillar covers and why it matters",
      "frequency": "how often (e.g. 2x/week)",
      "examples": ["post idea 1", "post idea 2", "post idea 3"]
    }
  ],
  "weeklyCalendar": [
    {
      "day": "Monday",
      "contentType": "carousel / reel / story / single post / thread",
      "pillar": "which content pillar this falls under",
      "idea": "specific post idea with brief description",
      "platform": "best platform for this",
      "bestTime": "optimal posting time (e.g. 9:00 AM EST)"
    }
  ],
  "brandVoiceGuide": {
    "tone": "description of the brand tone and personality",
    "vocabulary": ["power words to use regularly"],
    "avoidWords": ["words and phrases to never use"],
    "sampleCaption": "a sample post that perfectly embodies this brand voice"
  }
}`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text);
    return parsed;
  } catch {
    throw new Error('Failed to generate content strategy');
  }
}

export interface HookGeneratorResult {
  hooks: Array<{
    text: string;
    type: string;
    whyItWorks: string;
    bestFor: string;
  }>;
}

/**
 * Generate scroll-stopping hooks for a given topic.
 */
export async function generateHooks(
  topic: string,
  platform: string,
  count: number = 10,
): Promise<HookGeneratorResult> {
  const client = getClient();

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Generate ${count} scroll-stopping opening hooks for social media content.

Topic: ${topic}
Primary Platform: ${platform}

Each hook should use a DIFFERENT technique:
1. Curiosity Gap — "Most people don't realize..."
2. Contrarian Take — "Unpopular opinion:..."
3. Shocking Stat — Lead with a number
4. Personal Story — "I [did X] and [result]..."
5. Direct Challenge — "Stop doing [X]. Here's why:"
6. Social Proof — "After helping [N] people..."
7. Question Hook — "What if I told you..."
8. Confession — "I'm going to get hate for this but..."
9. Future Pacing — "In 6 months you'll wish you..."
10. Listicle — "[N] [things] that [result]"

Respond in JSON:
{
  "hooks": [
    {
      "text": "the full hook text (first 1-2 lines of a post)",
      "type": "which technique this uses",
      "whyItWorks": "brief psychology behind why this stops the scroll",
      "bestFor": "what type of content this hook leads into (educational, story, promotional, etc.)"
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
    return { hooks: parsed.hooks || [] };
  } catch {
    return { hooks: [] };
  }
}

export interface RepurposeResult {
  repurposed: Array<{
    platform: string;
    format: string;
    content: string;
    adaptationNotes: string;
  }>;
}

/**
 * Repurpose a single piece of content into multiple platform-native formats.
 */
export async function repurposeContent(
  originalContent: string,
  originalPlatform: string,
  targetPlatforms: string[],
): Promise<RepurposeResult> {
  const client = getClient();

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Repurpose this content from ${originalPlatform} into native-feeling content for each target platform. Don't just copy-paste — completely RETHINK the content for each platform's format, audience behavior, and best practices.

Original content (${originalPlatform}):
${originalContent}

Target platforms: ${targetPlatforms.join(', ')}

For each platform, specify:
- The best FORMAT for this content on that platform (thread, carousel, reel script, story sequence, single post, etc.)
- The fully adapted content ready to publish
- Notes on what was changed and why

Respond in JSON:
{
  "repurposed": [
    {
      "platform": "platform name",
      "format": "content format (e.g. 'carousel', 'thread', 'reel script')",
      "content": "the full adapted content ready to post",
      "adaptationNotes": "what was changed and why it works better for this platform"
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
    return { repurposed: parsed.repurposed || [] };
  } catch {
    return { repurposed: [] };
  }
}

// ─── Campaign Generator ────────────────────────────────────────

export interface CampaignPostOutline {
  postNumber: number;
  title: string;
  angle: string;
  contentType: 'text-post' | 'carousel-concept' | 'quote-card-idea' | 'video-hook' | 'thread';
  targetPlatform: string;
  briefDescription: string;
  framework: string;
}

export interface CampaignPlanResult {
  topic: string;
  campaignTheme: string;
  contentPillars: string[];
  platformMix: Record<string, number>;
  toneSummary: string;
  totalPosts: number;
  outlines: CampaignPostOutline[];
}

/**
 * Generate a campaign plan — outlines for multiple posts from a single topic.
 * Phase 1 of the two-phase campaign generation.
 */
export async function generateCampaignPlan(
  topic: string,
  platforms: string[],
  tone: string = 'professional',
  audience?: string,
  brandGuidance?: string,
  postCount: number = 20,
): Promise<CampaignPlanResult> {
  const client = getClient();

  const toneDescriptions: Record<string, string> = {
    professional: 'polished, authoritative, business-appropriate',
    casual: 'relaxed, conversational, friendly',
    inspirational: 'uplifting, motivational, empowering',
    humorous: 'witty, playful, entertaining',
    storytelling: 'narrative-driven, engaging, personal',
    'emperor-mode': 'bold, visionary, commanding — channeling the Emperor of HwinNwin Enterprises, conscious tech leader. Reference Protocol 69, The Alliance, consciousness technology.',
  };

  const toneDesc = toneDescriptions[tone] || toneDescriptions.professional;
  const audienceLine = audience ? `\nTarget Audience: ${audience}` : '';
  const brandLine = brandGuidance ? `\nBrand Voice Guidance: ${brandGuidance}` : '';

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `You are planning a full content CAMPAIGN — ${postCount} strategic social media posts from ONE topic. This is not random content — it's a cohesive campaign with a theme, content pillars, and intentional platform/format distribution.

Topic/Idea: ${topic}
Target Platforms: ${platforms.join(', ')}
Tone: ${tone} (${toneDesc})${audienceLine}${brandLine}
Number of Posts: ${postCount}

## PLATFORM + CONTENT TYPE BIASING (CRITICAL)
Assign content types to platforms where they perform BEST:
- "thread" → primarily X (Twitter) — threads are native to X
- "video-hook" → TikTok, YouTube, Instagram Reels — video-first platforms
- "carousel-concept" → LinkedIn, Instagram — carousel-native platforms
- "text-post" → LinkedIn, X, Facebook — text performs well here
- "quote-card-idea" → Instagram, Facebook — visual quote cards

Do NOT randomly assign types to platforms. Each post should be on the platform where its format thrives.

## ANGLE VARIETY
Use a DIFFERENT angle for each post. Draw from:
- "Hot Take" — challenge conventional wisdom
- "Story Time" — personal narrative with a lesson
- "Educational" — teach something actionable
- "Behind the Scenes" — raw, real, relatable
- "Social Proof" — results, numbers, transformation
- "Question/Poll" — spark conversation
- "Trend Jack" — ride a current cultural moment
- "Listicle" — "X things that..." format

## FRAMEWORK VARIETY
Each post should use a different copywriting framework:
- AIDA (Attention → Interest → Desire → Action)
- PAS (Problem → Agitate → Solve)
- Hook-Value-CTA
- Storytelling Arc
- BAB (Before → After → Bridge)

## OUTPUT
Generate a campaign theme (a catchy 3-5 word campaign name), 3-4 content pillars, platform distribution summary, and ${postCount} post outlines.

Respond in JSON:
{
  "campaignTheme": "catchy campaign name (3-5 words)",
  "contentPillars": ["pillar 1", "pillar 2", "pillar 3"],
  "platformMix": { "linkedin": 5, "x": 7, "instagram": 5, "tiktok": 3 },
  "toneSummary": "brief description of how tone was interpreted for this campaign",
  "totalPosts": ${postCount},
  "outlines": [
    {
      "postNumber": 1,
      "title": "short descriptive title for this post",
      "angle": "Hot Take",
      "contentType": "text-post",
      "targetPlatform": "linkedin",
      "briefDescription": "2-3 sentence description of what this post covers and its strategic purpose",
      "framework": "PAS"
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
      topic,
      campaignTheme: parsed.campaignTheme || 'Untitled Campaign',
      contentPillars: parsed.contentPillars || [],
      platformMix: parsed.platformMix || {},
      toneSummary: parsed.toneSummary || '',
      totalPosts: parsed.totalPosts || postCount,
      outlines: (parsed.outlines || []).map((o: CampaignPostOutline, i: number) => ({
        ...o,
        postNumber: o.postNumber || i + 1,
      })),
    };
  } catch {
    throw new Error('Failed to generate campaign plan');
  }
}

export interface CampaignGeneratedPost {
  postNumber: number;
  platform: string;
  content: string;
  hashtags: string[];
  charCount: number;
  contentType: string;
  angle: string;
  tip: string;
}

export interface CampaignBatchResult {
  posts: CampaignGeneratedPost[];
}

/**
 * Lighter system prompt for campaign batch generation.
 * The full SYSTEM_PROMPT is used during plan phase — for batch content generation,
 * we only need platform specs and copywriting guidance (saves ~1000 input tokens).
 */
const CAMPAIGN_BATCH_SYSTEM = `You are an expert social media copywriter. Write platform-native content that feels like it was created by a top-tier creator for THAT specific platform. Every post must be complete, ready to copy-paste and publish.

Platform specs:
- X (Twitter): MAX 280 chars. Punchy hooks, short sentences, bold claims.
- Instagram: MAX 2200 chars. Line breaks, storytelling, hashtags at end. First line = headline.
- LinkedIn: MAX 3000 chars. Thought-leadership, short paragraphs, end with a question.
- Facebook: Conversational, community-focused, questions that invite comments.
- TikTok: MAX 2200 chars. Short, trend-aware, CTA-driven. Hook in first line.
- YouTube: Community post style, SEO-friendly, CTAs for engagement.

Always respond in valid JSON only. No markdown fences, no explanation — just the JSON object.`;

/**
 * Generate full post content for a batch of campaign outlines.
 * Phase 2 of the two-phase campaign generation — called in batches of ~4.
 */
export async function generateCampaignBatch(
  topic: string,
  tone: string = 'professional',
  audience?: string,
  brandGuidance?: string,
  outlines: CampaignPostOutline[] = [],
): Promise<CampaignBatchResult> {
  const client = getClient();

  const toneDescriptions: Record<string, string> = {
    professional: 'polished, authoritative, business-appropriate',
    casual: 'relaxed, conversational, friendly',
    inspirational: 'uplifting, motivational, empowering',
    humorous: 'witty, playful, entertaining',
    storytelling: 'narrative-driven, engaging, personal',
    'emperor-mode': 'bold, visionary, commanding — channeling the Emperor of HwinNwin Enterprises, conscious tech leader. Reference Protocol 69, The Alliance, consciousness technology.',
  };

  const toneDesc = toneDescriptions[tone] || toneDescriptions.professional;
  const audienceLine = audience ? `\nTarget Audience: ${audience}` : '';
  const brandLine = brandGuidance ? `\nBrand Voice Guidance: ${brandGuidance}` : '';

  // Use compact JSON to reduce input tokens
  const outlinesJson = JSON.stringify(outlines);

  const createRequest = () => client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: CAMPAIGN_BATCH_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Write ${outlines.length} social media posts for this campaign. Return ONLY a JSON object.

Topic: ${topic}
Tone: ${tone} (${toneDesc})${audienceLine}${brandLine}

Outlines: ${outlinesJson}

Return this exact JSON structure:
{"posts":[{"postNumber":1,"platform":"linkedin","content":"FULL POST TEXT","hashtags":["tag1"],"charCount":245,"contentType":"text-post","angle":"Hot Take","tip":"brief tip"}]}`,
      },
    ],
  });

  // Railway has a 60s proxy timeout. We try once, and auto-retry on timeout.
  let message;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      // Race the API call against a 50s timeout to stay under Railway's 60s limit
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI_TIMEOUT')), 50000),
      );
      message = await Promise.race([createRequest(), timeout]);
      break; // Success, exit retry loop
    } catch (apiErr: any) {
      const errMsg = apiErr?.message || apiErr?.error?.message || 'Unknown API error';
      if (errMsg === 'AI_TIMEOUT' && attempt === 0) {
        console.warn('[AI] Campaign batch: timed out at 50s, retrying once...');
        continue;
      }
      const status = apiErr?.status || apiErr?.error?.status;
      const errType = apiErr?.error?.type || apiErr?.type;
      console.error(`[AI] Campaign batch API call failed (attempt=${attempt + 1}): status=${status} type=${errType} message=${errMsg}`);
      const wrapped = new Error(`AI API error: ${errMsg}`);
      (wrapped as any).status = status;
      throw wrapped;
    }
  }

  if (!message) {
    throw new Error('AI API error: request timed out after retries');
  }

  const stopReason = message.stop_reason;
  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  if (stopReason === 'max_tokens') {
    console.error('[AI] Campaign batch: response truncated (hit max_tokens). Output length:', text.length);
    throw new Error('AI response truncated — batch too large');
  }

  if (!text) {
    console.error('[AI] Campaign batch: empty response. stop_reason:', stopReason);
    throw new Error('AI returned empty response');
  }

  try {
    // Try direct JSON parse first (since we asked for no markdown fences)
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Fallback: extract JSON from markdown fences or find JSON object
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[AI] Campaign batch: no JSON found. stop_reason:', stopReason, 'First 500 chars:', text.slice(0, 500));
        throw new Error('Failed to parse AI response');
      }
      parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
    return { posts: parsed.posts || [] };
  } catch (err: any) {
    console.error('[AI] Campaign batch parse error:', err.message, 'stop_reason:', stopReason, 'First 500 chars:', text.slice(0, 500));
    throw new Error(`Failed to parse campaign batch: ${err.message}`);
  }
}

// ─── YouTube Tag Suggestions ────────────────────────────────────

export async function suggestYouTubeTags(
  title: string,
  description?: string,
  existingTags?: string[],
): Promise<{ tags: string[] }> {
  const client = getClient();

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: 'You are a YouTube SEO expert. Generate search-optimized tags that maximize video discoverability. Tags should be plain words/phrases (no # symbols). Mix broad and specific terms.',
    messages: [
      {
        role: 'user',
        content: `Suggest 15-20 YouTube search tags for this video.

Title: ${title}
${description ? `Description: ${description.slice(0, 500)}` : ''}
${existingTags?.length ? `Already have: ${existingTags.join(', ')}` : ''}

Include a mix of:
- Broad topic tags (1-2 words, high search volume)
- Specific niche tags (2-4 words, lower competition)
- Related/adjacent topic tags

Respond in JSON: { "tags": ["tag1", "tag2", ...] }`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text);
    // Strip any accidental # prefixes and deduplicate
    const tags = (parsed.tags || [])
      .map((t: string) => t.replace(/^#/, '').trim())
      .filter(Boolean);
    return { tags: [...new Set(tags)] as string[] };
  } catch {
    return { tags: [] };
  }
}
