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
  suggestYouTubeTags as aiSuggestTags,
  generateCampaignPlan as aiCampaignPlan,
  generateCampaignBatch as aiCampaignBatch,
  type CampaignPostOutline,
} from '../services/ai.js';
import { checkCredits, deductCredits, CREDIT_COSTS } from '../services/credits.js';

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

    const cost = CREDIT_COSTS.AI_ENHANCE;
    const creditCheck = await checkCredits(req.userId, cost);
    if (!creditCheck.allowed) {
      return res.status(402).json({ error: `Insufficient credits. Need ${cost}, have ${creditCheck.balance}.`, code: 'INSUFFICIENT_CREDITS', required: cost, balance: creditCheck.balance });
    }

    const result = await aiEnhance({ content, tone, platforms });
    await deductCredits(req.userId, cost, 'ai-enhance', 'AI content enhancement');
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

    const cost = CREDIT_COSTS.AI_THREAD;
    const cc = await checkCredits(req.userId, cost);
    if (!cc.allowed) return res.status(402).json({ error: `Insufficient credits. Need ${cost}, have ${cc.balance}.`, code: 'INSUFFICIENT_CREDITS', required: cost, balance: cc.balance });

    const result = await aiThread(content, maxTweets);
    await deductCredits(req.userId, cost, 'ai-thread', 'Thread generation');
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

    const cost = CREDIT_COSTS.AI_VARIANTS;
    const cc = await checkCredits(req.userId, cost);
    if (!cc.allowed) return res.status(402).json({ error: `Insufficient credits. Need ${cost}, have ${cc.balance}.`, code: 'INSUFFICIENT_CREDITS', required: cost, balance: cc.balance });

    const result = await aiVariants(content, platforms, count);
    await deductCredits(req.userId, cost, 'ai-variants', 'Content variants');
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

    const cost = CREDIT_COSTS.AI_BRAINSTORM;
    const cc = await checkCredits(req.userId, cost);
    if (!cc.allowed) return res.status(402).json({ error: `Insufficient credits. Need ${cost}, have ${cc.balance}.`, code: 'INSUFFICIENT_CREDITS', required: cost, balance: cc.balance });

    const result = await aiBrainstorm(keywords, platforms || [], tone, count);
    await deductCredits(req.userId, cost, 'ai-brainstorm', 'Content brainstorm');
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

    const cost = CREDIT_COSTS.AI_GENERATE_POSTS;
    const cc = await checkCredits(req.userId, cost);
    if (!cc.allowed) return res.status(402).json({ error: `Insufficient credits. Need ${cost}, have ${cc.balance}.`, code: 'INSUFFICIENT_CREDITS', required: cost, balance: cc.balance });

    const result = await aiGeneratePosts(topic, platforms, tone, context);
    await deductCredits(req.userId, cost, 'ai-generate-posts', 'Platform-specific post generation');
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

    const cost = CREDIT_COSTS.AI_STRATEGY;
    const cc = await checkCredits(req.userId, cost);
    if (!cc.allowed) return res.status(402).json({ error: `Insufficient credits. Need ${cost}, have ${cc.balance}.`, code: 'INSUFFICIENT_CREDITS', required: cost, balance: cc.balance });

    const result = await aiStrategy(
      brand,
      niche,
      audience || 'general audience',
      goals || ['grow audience', 'increase engagement'],
      platforms || ['instagram', 'x'],
    );
    await deductCredits(req.userId, cost, 'ai-strategy', 'Content strategy generation');
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

    const cost = CREDIT_COSTS.AI_HOOKS;
    const cc = await checkCredits(req.userId, cost);
    if (!cc.allowed) return res.status(402).json({ error: `Insufficient credits. Need ${cost}, have ${cc.balance}.`, code: 'INSUFFICIENT_CREDITS', required: cost, balance: cc.balance });

    const result = await aiHooks(topic, platform, Math.min(count, 15));
    await deductCredits(req.userId, cost, 'ai-hooks', 'Hook generation');
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

    const cost = CREDIT_COSTS.AI_REPURPOSE;
    const cc = await checkCredits(req.userId, cost);
    if (!cc.allowed) return res.status(402).json({ error: `Insufficient credits. Need ${cost}, have ${cc.balance}.`, code: 'INSUFFICIENT_CREDITS', required: cost, balance: cc.balance });

    const result = await aiRepurpose(
      content,
      originalPlatform || 'instagram',
      targetPlatforms || ['x', 'linkedin', 'facebook'],
    );
    await deductCredits(req.userId, cost, 'ai-repurpose', 'Content repurposing');
    res.json({ data: result });
  } catch (error) {
    console.error('[AI] Repurpose failed:', error);
    res.status(500).json({ error: 'Content repurpose failed. Please try again.' });
  }
});

// Suggest YouTube tags using AI
aiRouter.post('/suggest-tags', async (req, res) => {
  if (!requireAI(res)) return;

  try {
    const { title, description, existingTags } = req.body as {
      title: string;
      description?: string;
      existingTags?: string[];
    };

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const cost = CREDIT_COSTS.AI_SUGGEST_TAGS;
    const cc = await checkCredits(req.userId, cost);
    if (!cc.allowed) return res.status(402).json({ error: `Insufficient credits. Need ${cost}, have ${cc.balance}.`, code: 'INSUFFICIENT_CREDITS', required: cost, balance: cc.balance });

    const result = await aiSuggestTags(title, description, existingTags);
    await deductCredits(req.userId, cost, 'ai-suggest-tags', 'YouTube tag suggestions');
    res.json({ data: result });
  } catch (error) {
    console.error('[AI] Tag suggestion failed:', error);
    res.status(500).json({ error: 'Tag suggestion failed. Please try again.' });
  }
});

// ─── Campaign Generator ────────────────────────────────────

// Generate campaign plan (outlines) from a topic
aiRouter.post('/campaign-plan', async (req, res) => {
  if (!requireAI(res)) return;

  try {
    const { topic, platforms, tone = 'professional', audience, brandGuidance, postCount = 20 } = req.body as {
      topic: string;
      platforms: string[];
      tone?: string;
      audience?: string;
      brandGuidance?: string;
      postCount?: number;
    };

    if (!topic?.trim()) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    if (!platforms?.length) {
      return res.status(400).json({ error: 'At least one platform is required' });
    }

    const clampedCount = Math.min(Math.max(postCount, 5), 30);

    const cost = CREDIT_COSTS.AI_CAMPAIGN_PLAN;
    const cc = await checkCredits(req.userId, cost);
    if (!cc.allowed) {
      return res.status(402).json({
        error: `Insufficient credits. Need ${cost}, have ${cc.balance}.`,
        code: 'INSUFFICIENT_CREDITS',
        required: cost,
        balance: cc.balance,
      });
    }

    const result = await aiCampaignPlan(topic, platforms, tone, audience, brandGuidance, clampedCount);
    await deductCredits(req.userId, cost, 'ai-campaign-plan', `Campaign plan: "${result.campaignTheme}"`);
    res.json({ data: result });
  } catch (error) {
    console.error('[AI] Campaign plan failed:', error);
    res.status(500).json({ error: 'Campaign plan generation failed. Please try again.' });
  }
});

// Generate full content for a batch of campaign outlines
aiRouter.post('/campaign-generate', async (req, res) => {
  if (!requireAI(res)) return;

  try {
    const { topic, tone = 'professional', audience, brandGuidance, outlines } = req.body as {
      topic: string;
      tone?: string;
      audience?: string;
      brandGuidance?: string;
      outlines: CampaignPostOutline[];
    };

    if (!topic?.trim()) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    if (!outlines?.length) {
      return res.status(400).json({ error: 'At least one outline is required' });
    }
    if (outlines.length > 8) {
      return res.status(400).json({ error: 'Maximum 8 outlines per batch' });
    }

    const cost = CREDIT_COSTS.AI_CAMPAIGN_BATCH;
    const cc = await checkCredits(req.userId, cost);
    if (!cc.allowed) {
      return res.status(402).json({
        error: `Insufficient credits. Need ${cost}, have ${cc.balance}.`,
        code: 'INSUFFICIENT_CREDITS',
        required: cost,
        balance: cc.balance,
      });
    }

    const result = await aiCampaignBatch(topic, tone, audience, brandGuidance, outlines);
    await deductCredits(req.userId, cost, 'ai-campaign-batch', `Campaign batch: ${outlines.length} posts`);
    res.json({ data: result });
  } catch (error: any) {
    const statusCode = error?.status || error?.response?.status;
    const errorMsg = error?.message || 'Unknown error';
    console.error(`[AI] Campaign batch route error (status=${statusCode}):`, errorMsg);

    if (statusCode === 429) {
      return res.status(429).json({ error: 'AI rate limit reached. Please wait and retry.', code: 'RATE_LIMITED', detail: errorMsg });
    }
    if (statusCode === 529 || statusCode === 503) {
      return res.status(503).json({ error: 'AI service temporarily overloaded. Please retry.', code: 'AI_OVERLOADED', detail: errorMsg });
    }
    if (errorMsg.includes('truncated')) {
      return res.status(502).json({ error: 'AI response was truncated. Retrying should work.', code: 'AI_TRUNCATED', detail: errorMsg });
    }
    if (errorMsg.includes('parse') || errorMsg.includes('JSON')) {
      return res.status(502).json({ error: 'AI returned invalid format. Please retry.', code: 'AI_PARSE_ERROR', detail: errorMsg });
    }
    // Pass the actual error detail back so we can diagnose from browser console
    res.status(500).json({ error: 'Campaign generation failed.', code: 'UNKNOWN', detail: errorMsg });
  }
});
