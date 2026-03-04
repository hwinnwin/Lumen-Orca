import { Router } from 'express';
import { env } from '../config/env.js';
import {
  planCarousel,
  generateCarousel,
  regenerateSlide as regenerateSlideService,
  generateQuoteCard as generateQuoteCardService,
  isReplicateConfigured,
} from '../services/image-generator.js';
import type { SlidePlan, CarouselPlan } from '../services/image-generator.js';
import {
  planVideo,
  generateVideo,
  generateVideoFromSlide,
} from '../services/video-generator.js';
import type { VideoPlatform } from '../services/video-generator.js';

export const generatorRouter = Router();

// Check capabilities
generatorRouter.get('/capabilities', (_req, res) => {
  res.json({
    data: {
      aiImages: isReplicateConfigured,
      aiVideo: isReplicateConfigured,
      message: isReplicateConfigured
        ? 'AI image and video generation is available via Replicate'
        : 'Using gradient fallback — add REPLICATE_API_TOKEN for AI-generated images and video',
    },
  });
});

// Plan a carousel (Claude only — fast)
generatorRouter.post('/plan', async (req, res) => {
  if (!env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error: 'AI is not configured. Add your ANTHROPIC_API_KEY to enable the content generator.',
    });
  }

  try {
    const { topic, contentType = 'carousel', slideCount = 5, tone = 'professional' } = req.body as {
      topic: string;
      contentType?: 'carousel' | 'quote-card' | 'mixed-media' | 'educational';
      slideCount?: number;
      tone?: string;
    };

    if (!topic?.trim()) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const count = Math.min(Math.max(slideCount, 2), 10);
    const plan = await planCarousel(topic, contentType, count, tone);

    res.json({ data: plan });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Generator] Plan failed:', errMsg);
    res.status(500).json({ error: `Carousel plan generation failed: ${errMsg}` });
  }
});

// Generate all slides from a plan (Replicate + Sharp — slow)
generatorRouter.post('/generate', async (req, res) => {
  try {
    const { plan } = req.body as { plan: CarouselPlan };
    const userId = req.userId;

    if (!plan?.slides?.length) {
      return res.status(400).json({ error: 'A valid plan with slides is required' });
    }

    const slides = await generateCarousel(plan, userId);

    res.json({
      data: {
        slides,
        caption: plan.caption,
        hashtags: plan.hashtags,
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Generator] Generate failed:', errMsg);
    res.status(500).json({ error: `Slide generation failed: ${errMsg}` });
  }
});

// Regenerate a single slide
generatorRouter.post('/regenerate-slide', async (req, res) => {
  try {
    const { slide } = req.body as { slide: SlidePlan };
    const userId = req.userId;

    if (!slide?.title) {
      return res.status(400).json({ error: 'A valid slide plan is required' });
    }

    const result = await regenerateSlideService(slide, userId);
    res.json({ data: result });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Generator] Regenerate slide failed:', errMsg);
    res.status(500).json({ error: `Slide regeneration failed: ${errMsg}` });
  }
});

// Generate a quote card
generatorRouter.post('/quote-card', async (req, res) => {
  try {
    const { quote, author, style = {} } = req.body as {
      quote: string;
      author: string;
      style?: { backgroundColor?: string; textColor?: string; accentColor?: string };
    };
    const userId = req.userId;

    if (!quote?.trim()) {
      return res.status(400).json({ error: 'Quote text is required' });
    }

    const result = await generateQuoteCardService(quote, author || 'Unknown', style, userId);
    res.json({ data: result });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Generator] Quote card failed:', errMsg);
    res.status(500).json({ error: `Quote card generation failed: ${errMsg}` });
  }
});

// ─── Video Endpoints ────────────────────────────────────

// Plan a video (Claude only — fast)
generatorRouter.post('/video/plan', async (req, res) => {
  if (!env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error: 'AI is not configured. Add your ANTHROPIC_API_KEY to enable video planning.',
    });
  }

  try {
    const { topic, platform = 'reels', tone = 'professional' } = req.body as {
      topic: string;
      platform?: VideoPlatform;
      tone?: string;
    };

    if (!topic?.trim()) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const plan = await planVideo(topic, platform, tone);
    res.json({ data: plan });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Generator] Video plan failed:', errMsg);
    res.status(500).json({ error: `Video plan generation failed: ${errMsg}` });
  }
});

// Generate a video from a prompt (Replicate — slow, 30-120s)
generatorRouter.post('/video/generate', async (req, res) => {
  try {
    const { prompt, sourceImageUrl, duration = 6, aspectRatio = '9:16' } = req.body as {
      prompt: string;
      sourceImageUrl?: string;
      duration?: 6 | 10;
      aspectRatio?: '9:16' | '1:1' | '16:9';
    };
    const userId = req.userId;

    if (!prompt?.trim()) {
      return res.status(400).json({ error: 'A video prompt is required' });
    }

    const result = await generateVideo(
      { prompt, sourceImageUrl, duration, aspectRatio },
      userId,
    );

    res.json({ data: result });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Generator] Video generation failed:', errMsg);
    if (error instanceof Error && error.stack) {
      console.error('[Generator] Stack:', error.stack);
    }
    res.status(500).json({ error: `Video generation failed: ${errMsg}` });
  }
});

// Animate an existing carousel slide into a video
generatorRouter.post('/video/animate-slide', async (req, res) => {
  try {
    const { slideImageUrl, motionPrompt, duration = 6 } = req.body as {
      slideImageUrl: string;
      motionPrompt?: string;
      duration?: 6 | 10;
    };
    const userId = req.userId;

    if (!slideImageUrl?.trim()) {
      return res.status(400).json({ error: 'A slide image URL is required' });
    }

    const result = await generateVideoFromSlide(slideImageUrl, motionPrompt || '', userId, duration);
    res.json({ data: result });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Generator] Slide animation failed:', errMsg);
    res.status(500).json({ error: `Slide animation failed: ${errMsg}` });
  }
});
