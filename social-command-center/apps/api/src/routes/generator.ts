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

export const generatorRouter = Router();

// Check capabilities
generatorRouter.get('/capabilities', (_req, res) => {
  res.json({
    data: {
      aiImages: isReplicateConfigured,
      message: isReplicateConfigured
        ? 'AI image generation is available via Replicate'
        : 'Using gradient fallback — add REPLICATE_API_TOKEN for AI-generated images',
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
