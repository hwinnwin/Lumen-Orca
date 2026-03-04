import { Router } from 'express';
import {
  getOrCreateBalance,
  getTransactionHistory,
  addCredits,
  checkCredits,
  calculateVideoCost,
  calculateCarouselCost,
  CREDIT_COSTS,
} from '../services/credits.js';

export const creditsRouter = Router();

// Get current credit balance
creditsRouter.get('/balance', async (req, res) => {
  try {
    const balance = await getOrCreateBalance(req.userId);
    res.json({
      data: {
        balance: balance.balance,
        lifetimeUsed: balance.lifetimeUsed,
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Credits] Balance fetch failed:', errMsg);
    res.status(500).json({ error: 'Failed to fetch credit balance' });
  }
});

// Get transaction history
creditsRouter.get('/history', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await getTransactionHistory(req.userId, { limit, offset });
    res.json({ data: result });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Credits] History fetch failed:', errMsg);
    res.status(500).json({ error: 'Failed to fetch credit history' });
  }
});

// Check if user can afford a specific generation
creditsRouter.post('/check', async (req, res) => {
  try {
    const { generationType, options } = req.body as {
      generationType: string;
      options?: { totalDuration?: number; hasMusic?: boolean; hasVoiceover?: boolean; slideCount?: number };
    };

    let cost: number;

    switch (generationType) {
      case 'video':
        cost = calculateVideoCost({
          totalDuration: options?.totalDuration ?? 6,
          hasMusic: options?.hasMusic ?? false,
          hasVoiceover: options?.hasVoiceover ?? false,
        });
        break;
      case 'carousel':
        cost = calculateCarouselCost(options?.slideCount ?? 5);
        break;
      case 'slide-regenerate':
        cost = CREDIT_COSTS.SLIDE_REGENERATE;
        break;
      case 'quote-card':
        cost = CREDIT_COSTS.QUOTE_CARD;
        break;
      default:
        cost = CREDIT_COSTS[generationType as keyof typeof CREDIT_COSTS] ?? 0;
    }

    const result = await checkCredits(req.userId, cost);
    res.json({ data: result });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Credits] Check failed:', errMsg);
    res.status(500).json({ error: 'Failed to check credits' });
  }
});

// Add credits (admin/manual topup — in production, this would be behind a payment gateway)
creditsRouter.post('/topup', async (req, res) => {
  try {
    const { amount, description } = req.body as { amount: number; description?: string };

    if (!amount || amount <= 0 || amount > 100000) {
      return res.status(400).json({ error: 'Amount must be between 1 and 100000 credits' });
    }

    const updated = await addCredits(
      req.userId,
      amount,
      'TOPUP',
      description || `Manual top-up: ${amount} credits`,
    );

    res.json({
      data: {
        balance: updated.balance,
        added: amount,
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Credits] Topup failed:', errMsg);
    res.status(500).json({ error: 'Failed to add credits' });
  }
});

// Get the cost table (for frontend display)
creditsRouter.get('/costs', (_req, res) => {
  res.json({
    data: {
      costs: CREDIT_COSTS,
      descriptions: {
        VIDEO_SEGMENT: 'Per 10s video clip',
        VIDEO_MUSIC: 'Background music (per video)',
        VIDEO_VOICEOVER: 'AI voiceover (per video)',
        CAROUSEL_FULL: 'Full carousel generation',
        SLIDE_REGENERATE: 'Regenerate single slide',
        QUOTE_CARD: 'Quote card generation',
        AI_ENHANCE: 'AI text enhancement',
        AI_BRAINSTORM: 'Content brainstorm',
        AI_VARIANTS: 'Generate content variants',
        AI_THREAD: 'Thread generation',
        AI_HOOKS: 'Hook generation',
        AI_REPURPOSE: 'Content repurposing',
        AI_STRATEGY: 'Content strategy',
        AI_GENERATE_POSTS: 'Platform-specific posts',
        VIDEO_PLAN: 'Video planning (free)',
        CAROUSEL_PLAN: 'Carousel planning (free)',
      },
    },
  });
});
