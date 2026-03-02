import { Router } from 'express';
import { env } from '../config/env.js';
import {
  enhanceContent as aiEnhance,
  generateThread as aiThread,
  generateVariants as aiVariants,
  brainstormFromKeywords as aiBrainstorm,
  generateMultiPlatformPosts as aiGeneratePosts,
  generateContentStrategy as aiStrategy,
  generateHooks as aiHooks,
  repurposeContent as aiRepurpose,
} from '../services/ai.js';

export const aiRouter = Router();

/**
 * Guard: require ANTHROPIC_API_KEY.
 * No more silent fallbacks to generic placeholder text.
 */
function requireAI(res: import('express').Response): boolean {
  if (!env.ANTHROPIC_API_KEY) {
    res.status(503).json({
      error: 'AI is not configured. Add your ANTHROPIC_API_KEY to enable AI-powered content generation.',
    });
    return false;
  }
  return true;
}

// Enhance content with AI
aiRouter.post('/enhance', async (req, res) => {
  if (!requireAI(res)) return;

  try {
    const { content, tone, platforms } = req.body as {
      content: string;
      tone: string;
      platforms: string[];
    };

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const result = await aiEnhance({ content, tone, platforms });
    res.json({ data: result });
  } catch (error) {
    console.error('[AI] Enhancement failed:', error);
    res.status(500).json({ error: 'AI enhancement failed. Please try again.' });
  }
});

// Generate thread for X
aiRouter.post('/thread', async (req, res) => {
  if (!requireAI(res)) return;

  try {
    const { content, maxTweets = 10 } = req.body as {
      content: string;
      maxTweets?: number;
    };

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const result = await aiThread(content, maxTweets);
    res.json({ data: result });
  } catch (error) {
    console.error('[AI] Thread generation failed:', error);
    res.status(500).json({ error: 'Thread generation failed. Please try again.' });
  }
});

// Generate caption variants
aiRouter.post('/variants', async (req, res) => {
  if (!requireAI(res)) return;

  try {
    const { content, platforms, count = 3 } = req.body as {
      content: string;
      platforms: string[];
      count?: number;
    };

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const result = await aiVariants(content, platforms, count);
    res.json({ data: { variants: result } });
  } catch (error) {
    console.error('[AI] Variant generation failed:', error);
    res.status(500).json({ error: 'Variant generation failed. Please try again.' });
  }
});

// Brainstorm posts from keywords
aiRouter.post('/brainstorm', async (req, res) => {
  if (!requireAI(res)) return;

  try {
    const { keywords, platforms, tone = 'professional', count = 3 } = req.body as {
      keywords: string[];
      platforms: string[];
      tone?: string;
      count?: number;
    };

    if (!keywords?.length) {
      return res.status(400).json({ error: 'At least one keyword is required' });
    }

    const result = await aiBrainstorm(keywords, platforms || [], tone, count);
    res.json({ data: result });
  } catch (error) {
    console.error('[AI] Brainstorm failed:', error);
    res.status(500).json({ error: 'Brainstorm failed. Please try again.' });
  }
});

// Generate tailored posts for each platform from a single topic
aiRouter.post('/generate-posts', async (req, res) => {
  if (!requireAI(res)) return;

  try {
    const { topic, platforms, tone = 'professional', context } = req.body as {
      topic: string;
      platforms: string[];
      tone?: string;
      context?: string;
    };

    if (!topic?.trim()) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    if (!platforms?.length) {
      return res.status(400).json({ error: 'At least one platform is required' });
    }

    const result = await aiGeneratePosts(topic, platforms, tone, context);
    res.json({ data: result });
  } catch (error) {
    console.error('[AI] Post generation failed:', error);
    res.status(500).json({ error: 'Post generation failed. Please try again.' });
  }
});

// Generate content strategy
aiRouter.post('/strategy', async (req, res) => {
  if (!requireAI(res)) return;

  try {
    const { brand, niche, audience, goals, platforms } = req.body as {
      brand: string;
      niche: string;
      audience: string;
      goals: string[];
      platforms: string[];
    };

    if (!brand?.trim() || !niche?.trim()) {
      return res.status(400).json({ error: 'Brand and niche are required' });
    }

    const result = await aiStrategy(
      brand,
      niche,
      audience || 'general audience',
      goals || ['grow audience', 'increase engagement'],
      platforms || ['instagram', 'x'],
    );
    res.json({ data: result });
  } catch (error) {
    console.error('[AI] Strategy generation failed:', error);
    res.status(500).json({ error: 'Strategy generation failed. Please try again.' });
  }
});

// Generate scroll-stopping hooks
aiRouter.post('/hooks', async (req, res) => {
  if (!requireAI(res)) return;

  try {
    const { topic, platform = 'instagram', count = 10 } = req.body as {
      topic: string;
      platform?: string;
      count?: number;
    };

    if (!topic?.trim()) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const result = await aiHooks(topic, platform, Math.min(count, 15));
    res.json({ data: result });
  } catch (error) {
    console.error('[AI] Hook generation failed:', error);
    res.status(500).json({ error: 'Hook generation failed. Please try again.' });
  }
});

// Repurpose content across platforms
aiRouter.post('/repurpose', async (req, res) => {
  if (!requireAI(res)) return;

  try {
    const { content, originalPlatform, targetPlatforms } = req.body as {
      content: string;
      originalPlatform: string;
      targetPlatforms: string[];
    };

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const result = await aiRepurpose(
      content,
      originalPlatform || 'instagram',
      targetPlatforms || ['x', 'linkedin', 'facebook'],
    );
    res.json({ data: result });
  } catch (error) {
    console.error('[AI] Repurpose failed:', error);
    res.status(500).json({ error: 'Content repurpose failed. Please try again.' });
  }
});
