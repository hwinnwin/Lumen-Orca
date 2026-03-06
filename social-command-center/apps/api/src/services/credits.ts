import { prisma } from '../db/client.js';
import type { CreditTxType } from '@prisma/client';

// ─── Credit Cost Definitions (in credit cents, 100 = $1.00) ─────

/**
 * Cost table for generation types.
 * All costs include a ~3x markup over raw Replicate/API costs.
 * Users buy credits at $1 = 100 credits, so 100 credits = $1.00.
 *
 * Raw costs → Customer price:
 *   Video clip (10s):  ~$0.35 raw → 100 credits ($1.00)
 *   Music generation:   ~$0.05 raw →  20 credits ($0.20)
 *   Voiceover:          ~$0.05 raw →  20 credits ($0.20)
 *   Carousel (full):    ~$0.50 raw → 150 credits ($1.50)
 *   Single slide regen: ~$0.10 raw →  30 credits ($0.30)
 *   Quote card:         ~$0.05 raw →  15 credits ($0.15)
 *   AI text enhance:    ~$0.01 raw →   5 credits ($0.05)
 */

export const CREDIT_COSTS = {
  // Video: cost per segment (10s clip)
  VIDEO_SEGMENT: 100,
  // Audio add-ons
  VIDEO_MUSIC: 20,
  VIDEO_VOICEOVER: 20,
  // Carousel
  CAROUSEL_FULL: 150,   // Full carousel generation (all slides)
  SLIDE_REGENERATE: 30, // Single slide regeneration
  // Quote card
  QUOTE_CARD: 15,
  // AI text features
  AI_ENHANCE: 5,
  AI_BRAINSTORM: 5,
  AI_VARIANTS: 5,
  AI_THREAD: 5,
  AI_HOOKS: 5,
  AI_REPURPOSE: 10,
  AI_STRATEGY: 15,
  AI_GENERATE_POSTS: 10,
  AI_SUGGEST_TAGS: 5,
  AI_CHAT: 3,
  // Video editor export
  VIDEO_EXPORT: 50,
  // Planning (free — planning doesn't cost much and encourages usage)
  VIDEO_PLAN: 0,
  CAROUSEL_PLAN: 0,
} as const;

export type GenerationType = keyof typeof CREDIT_COSTS;

/** Signup bonus — new users get 500 credits ($5.00 worth) */
export const SIGNUP_BONUS_CREDITS = 500;

// ─── Service Functions ──────────────────────────────────────────

/**
 * Get or create a credit balance for a user.
 * New users automatically get a signup bonus.
 */
export async function getOrCreateBalance(userId: string) {
  let balance = await prisma.creditBalance.findUnique({
    where: { userId },
  });

  if (!balance) {
    balance = await prisma.creditBalance.create({
      data: {
        userId,
        balance: SIGNUP_BONUS_CREDITS,
        transactions: {
          create: {
            amount: SIGNUP_BONUS_CREDITS,
            type: 'BONUS',
            description: 'Welcome bonus — enjoy your first generations!',
            metadata: { reason: 'signup' },
          },
        },
      },
    });
  }

  return balance;
}

/**
 * Check if a user has enough credits for a generation.
 * Returns { allowed, balance, cost, shortfall }.
 */
export async function checkCredits(userId: string, cost: number) {
  const creditBalance = await getOrCreateBalance(userId);
  const allowed = creditBalance.balance >= cost;
  return {
    allowed,
    balance: creditBalance.balance,
    cost,
    shortfall: allowed ? 0 : cost - creditBalance.balance,
  };
}

/**
 * Deduct credits for a generation. Creates a transaction record.
 * Throws if insufficient balance.
 */
export async function deductCredits(
  userId: string,
  cost: number,
  generationType: string,
  description: string,
  metadata?: Record<string, unknown>,
) {
  const creditBalance = await getOrCreateBalance(userId);

  if (creditBalance.balance < cost) {
    throw new Error(`Insufficient credits: need ${cost}, have ${creditBalance.balance}`);
  }

  const updated = await prisma.creditBalance.update({
    where: { userId },
    data: {
      balance: { decrement: cost },
      lifetimeUsed: { increment: cost },
      transactions: {
        create: {
          amount: -cost,
          type: 'GENERATION' as CreditTxType,
          description,
          generationType,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        },
      },
    },
  });

  return updated;
}

/**
 * Add credits to a user's balance (topup or bonus).
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: 'TOPUP' | 'BONUS' | 'REFUND',
  description: string,
  metadata?: Record<string, unknown>,
) {
  const creditBalance = await getOrCreateBalance(userId);

  const updated = await prisma.creditBalance.update({
    where: { userId },
    data: {
      balance: { increment: amount },
      transactions: {
        create: {
          amount,
          type: type as CreditTxType,
          description,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        },
      },
    },
  });

  return updated;
}

/**
 * Get transaction history for a user.
 */
export async function getTransactionHistory(
  userId: string,
  opts: { limit?: number; offset?: number } = {},
) {
  const { limit = 50, offset = 0 } = opts;

  const creditBalance = await getOrCreateBalance(userId);

  const [transactions, total] = await Promise.all([
    prisma.creditTransaction.findMany({
      where: { creditBalanceId: creditBalance.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.creditTransaction.count({
      where: { creditBalanceId: creditBalance.id },
    }),
  ]);

  return { transactions, total, balance: creditBalance.balance, lifetimeUsed: creditBalance.lifetimeUsed };
}

// ─── Cost Calculators ───────────────────────────────────────────

/**
 * Calculate the credit cost for a video generation.
 */
export function calculateVideoCost(opts: {
  totalDuration: number;
  hasMusic: boolean;
  hasVoiceover: boolean;
}) {
  const segments = Math.ceil(opts.totalDuration / 10);
  let cost = segments * CREDIT_COSTS.VIDEO_SEGMENT;
  if (opts.hasMusic) cost += CREDIT_COSTS.VIDEO_MUSIC;
  if (opts.hasVoiceover) cost += CREDIT_COSTS.VIDEO_VOICEOVER;
  return cost;
}

/**
 * Calculate the credit cost for a carousel generation.
 */
export function calculateCarouselCost(_slideCount: number) {
  // Flat rate for full carousel regardless of slide count
  return CREDIT_COSTS.CAROUSEL_FULL;
}
