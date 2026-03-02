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

const SYSTEM_PROMPT = `You are the AI engine for Lumen ORCA (Omni-Resonant Content Amplifier), a social media command center built by HwinNwin Enterprises and Lumen Systems.

Your role is to enhance social media content to maximize engagement while maintaining the author's authentic voice. You understand platform-specific best practices:

- X (Twitter): Punchy, hook-first, 280 chars max per tweet. Use threads for long-form.
- LinkedIn: Professional tone, industry context, story-driven. First line is crucial.
- Instagram: Visual storytelling, line breaks for readability, hashtags in first comment.
- Facebook: Conversational, community-focused, longer form OK.
- TikTok: Trend-aware, Gen-Z speak OK, CTA-driven.
- YouTube: SEO-optimized titles and descriptions, timestamps, CTAs for subscribe.

Always maintain the core message. Never fabricate facts or claims.`;

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
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Enhance this social media post with a ${request.tone} tone (${toneDesc}). ${platformContext}

Original content:
${request.content}

Respond in JSON format:
{
  "enhanced": "the enhanced post text",
  "hashtags": ["relevant", "hashtags"],
  "platformTips": {
    "platform_name": "specific tip for this platform"
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
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Convert this content into an engaging X (Twitter) thread. Max ${maxTweets} tweets, each under 280 characters.

Rules:
- First tweet should be a strong hook
- Each tweet should stand on its own but flow naturally
- Add thread numbering (1/N format)
- End with a CTA or key takeaway
- Use line breaks within tweets for readability

Content:
${content}

Respond in JSON format:
{
  "tweets": ["1/N tweet text", "2/N tweet text", ...]
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
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `You are brainstorming social media posts from keywords. Generate ${count} unique, ready-to-publish post ideas.

Keywords/topics: ${keywords.join(', ')}
Target platforms: ${platforms.join(', ')}
Tone: ${tone} (${toneDesc})

Rules:
- Each post should be a complete, ready-to-publish caption
- Vary the angles — don't repeat the same approach
- Respect platform character limits (X: 280 chars, others: longer OK)
- Include relevant hashtags
- Each post needs a short "hook" label (2-4 words) describing the angle
- Make them engaging, not generic

Respond in JSON format:
{
  "posts": [
    {
      "content": "the full post text ready to copy-paste",
      "platform": "best platform for this post (x, instagram, linkedin, facebook, tiktok, youtube)",
      "hook": "short angle label like 'Hot Take' or 'Behind The Scenes'",
      "hashtags": ["relevant", "hashtags"]
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
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Generate a tailored post for EACH of the following platforms from a single topic. Each post should be completely different in structure and approach — not just the same text shortened or lengthened.

Topic/Idea: ${topic}${contextLine}
Tone: ${tone} (${toneDesc})

Platform requirements:
${platformInstructions}

Rules:
- Each post MUST respect its platform's character limit strictly
- Each post should feel NATIVE to that platform (not like a copy-paste)
- X posts should be punchy and tweetable
- LinkedIn posts should read like thought leadership
- Instagram captions should use line breaks and visual language
- Facebook posts should invite community engagement
- TikTok captions should have energy and trend awareness
- Include relevant hashtags per platform
- Include a short actionable tip for each post

Respond in JSON format:
{
  "posts": [
    {
      "platform": "x",
      "content": "the full post text ready to publish",
      "hashtags": ["relevant", "hashtags"],
      "charCount": 142,
      "tip": "one-line tip about why this works on this platform"
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
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Generate ${count} alternative versions of this social media post, each taking a different creative angle. Target platforms: ${platforms.join(', ')}.

Original:
${content}

Respond in JSON format:
{
  "variants": [
    {
      "content": "the variant text",
      "angle": "short label like 'Direct', 'Question', 'Story'",
      "reasoning": "brief explanation of why this angle works"
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
