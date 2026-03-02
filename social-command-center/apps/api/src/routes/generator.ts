import { Router } from 'express';
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
    console.error('[Generator] Plan failed:', error);
    res.status(500).json({ error: 'Failed to generate carousel plan' });
  }
});

// Generate all slides from a plan (Replicate + Sharp — slow)
generatorRouter.post('/generate', async (req, res) => {
  try {
    const { plan } = req.body as { plan: CarouselPlan };
    const userId = (req as any).user?.id;

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
    console.error('[Generator] Generate failed:', error);
    res.status(500).json({ error: 'Failed to generate carousel slides' });
  }
});

// Regenerate a single slide
generatorRouter.post('/regenerate-slide', async (req, res) => {
  try {
    const { slide } = req.body as { slide: SlidePlan };
    const userId = (req as any).user?.id;

    if (!slide?.title) {
      return res.status(400).json({ error: 'A valid slide plan is required' });
    }

    const result = await regenerateSlideService(slide, userId);
    res.json({ data: result });
  } catch (error) {
    console.error('[Generator] Regenerate slide failed:', error);
    res.status(500).json({ error: 'Failed to regenerate slide' });
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
    const userId = (req as any).user?.id;

    if (!quote?.trim()) {
      return res.status(400).json({ error: 'Quote text is required' });
    }

    const result = await generateQuoteCardService(quote, author || 'Unknown', style, userId);
    res.json({ data: result });
  } catch (error) {
    console.error('[Generator] Quote card failed:', error);
    res.status(500).json({ error: 'Failed to generate quote card' });
  }
});
