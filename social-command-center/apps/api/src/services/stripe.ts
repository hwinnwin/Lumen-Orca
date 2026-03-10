import Stripe from 'stripe';
import { env } from '../config/env.js';
import { prisma } from '../db/client.js';
import type { SubscriptionTier } from '@prisma/client';

// ─── Stripe Client ─────────────────────────────────────

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : (null as unknown as Stripe);

// ─── Tier <-> Price Mapping ────────────────────────────

export function tierFromPriceId(priceId: string): SubscriptionTier {
  if (priceId === env.STRIPE_PRICE_PRO) return 'PRO';
  if (priceId === env.STRIPE_PRICE_PREMIUM) return 'PREMIUM';
  if (priceId === env.STRIPE_PRICE_POWER) return 'POWER';
  return 'FREE';
}

export function priceIdFromTier(tier: string): string | null {
  if (tier === 'PRO') return env.STRIPE_PRICE_PRO || null;
  if (tier === 'PREMIUM') return env.STRIPE_PRICE_PREMIUM || null;
  if (tier === 'POWER') return env.STRIPE_PRICE_POWER || null;
  return null;
}

// ─── Tier Hierarchy ────────────────────────────────────

const TIER_LEVELS: Record<string, number> = {
  FREE: 0,
  PRO: 1,
  PREMIUM: 2,
  POWER: 3,
};

export function tierLevel(tier: string): number {
  return TIER_LEVELS[tier] ?? 0;
}

export function hasTierAccess(userTier: string, requiredTier: string): boolean {
  return tierLevel(userTier) >= tierLevel(requiredTier);
}

// ─── Credit Bonus Rates ────────────────────────────────

const TIER_BONUS_RATES: Record<string, number> = {
  FREE: 0,
  PRO: 0.05,     // 5%
  PREMIUM: 0.10, // 10%
  POWER: 0.10,   // 10%
};

export function getCreditBonusRate(tier: string): number {
  return TIER_BONUS_RATES[tier] ?? 0;
}

// ─── Monthly Credit Allowance ─────────────────────────
// Each tier gets credits matching their price + tier bonus, added each billing cycle.
// Credits accumulate (no reset).

const TIER_MONTHLY_BASE_CREDITS: Record<string, number> = {
  FREE: 0,
  PRO: 2900,     // $29 worth
  PREMIUM: 8900, // $89 worth
  POWER: 19900,  // $199 worth
};

/** Get total monthly credits for a tier (base + bonus). */
export function getMonthlyCredits(tier: string): { base: number; bonus: number; total: number } {
  const base = TIER_MONTHLY_BASE_CREDITS[tier] ?? 0;
  const bonusRate = TIER_BONUS_RATES[tier] ?? 0;
  const bonus = Math.floor(base * bonusRate);
  return { base, bonus, total: base + bonus };
}

// ─── Customer Management ───────────────────────────────

export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });

  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: { userId: user.id },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// ─── Checkout Session ──────────────────────────────────

export async function createCheckoutSession(userId: string, tier: string): Promise<string> {
  const priceId = priceIdFromTier(tier);
  if (!priceId) throw new Error(`Invalid tier: ${tier}`);

  const customerId = await getOrCreateStripeCustomer(userId);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.APP_URL}/settings?billing=success`,
    cancel_url: `${env.APP_URL}/settings?billing=canceled`,
    metadata: { userId, tier },
    subscription_data: {
      metadata: { userId, tier },
    },
  });

  return session.url!;
}

// ─── Customer Portal ───────────────────────────────────

export async function createPortalSession(userId: string): Promise<string> {
  const customerId = await getOrCreateStripeCustomer(userId);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${env.APP_URL}/settings`,
  });

  return session.url;
}

// ─── Sync Subscription State ───────────────────────────

export async function syncSubscription(stripeSubscription: Stripe.Subscription): Promise<void> {
  const userId = stripeSubscription.metadata.userId;
  if (!userId) {
    console.error('[Stripe] Subscription missing userId in metadata:', stripeSubscription.id);
    return;
  }

  const priceId = stripeSubscription.items.data[0]?.price.id;
  const tier = priceId ? tierFromPriceId(priceId) : 'FREE';
  const status = mapStripeStatus(stripeSubscription.status);

  // Stripe SDK v20+ removed current_period_start/end from types
  // but the API still returns them — access via any cast
  const sub = stripeSubscription as any;
  const periodStart = new Date((sub.current_period_start ?? stripeSubscription.start_date) * 1000);
  const periodEnd = new Date((sub.current_period_end ?? stripeSubscription.start_date) * 1000);
  const canceledAt = stripeSubscription.canceled_at
    ? new Date(stripeSubscription.canceled_at * 1000)
    : null;

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: stripeSubscription.id },
    create: {
      userId,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId || '',
      status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      canceledAt,
    },
    update: {
      stripePriceId: priceId || '',
      status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      canceledAt,
    },
  });

  // Update user tier based on subscription status
  const effectiveTier = (status === 'ACTIVE' || status === 'TRIALING') ? tier : 'FREE';
  await prisma.user.update({
    where: { id: userId },
    data: { tier: effectiveTier },
  });

  console.log(`[Stripe] Synced subscription ${stripeSubscription.id} -> user ${userId}, tier=${effectiveTier}, status=${status}`);
}

// ─── Monthly Credit Grant ─────────────────────────────

/**
 * Grant monthly subscription credits to a user.
 * Called when a subscription invoice is paid (new billing cycle).
 * Credits accumulate — they are added on top of existing balance.
 */
export async function grantMonthlyCredits(userId: string, tier: string): Promise<void> {
  const { base, bonus, total } = getMonthlyCredits(tier);
  if (total <= 0) return;

  // Ensure credit balance exists
  let creditBalance = await prisma.creditBalance.findUnique({ where: { userId } });
  if (!creditBalance) {
    // Lazy-create via dynamic import to avoid circular deps
    const { getOrCreateBalance } = await import('./credits.js');
    creditBalance = await getOrCreateBalance(userId);
  }

  // Add base subscription credits
  await prisma.creditBalance.update({
    where: { userId },
    data: {
      balance: { increment: base },
      transactions: {
        create: {
          amount: base,
          type: 'SUBSCRIPTION',
          description: `${tier} monthly credits (${base} credits)`,
          metadata: { reason: 'monthly_subscription', tier },
        },
      },
    },
  });

  // Add tier bonus as separate transaction
  if (bonus > 0) {
    await prisma.creditBalance.update({
      where: { userId },
      data: {
        balance: { increment: bonus },
        transactions: {
          create: {
            amount: bonus,
            type: 'BONUS',
            description: `${getCreditBonusRate(tier) * 100}% tier bonus on ${base} monthly credits`,
            metadata: { reason: 'monthly_subscription_bonus', tier, baseAmount: base },
          },
        },
      },
    });
  }

  console.log(`[Stripe] Granted monthly credits to user ${userId}: ${base} base + ${bonus} bonus = ${total} total (${tier})`);
}

// ─── Auto Top-Up Charge ──────────────────────────────

/**
 * Charge the customer's default payment method for an auto top-up.
 * Credits are 100 = $1.00, so `creditAmount` of 1000 = $10.00.
 * Returns the PaymentIntent ID on success, or null if charge fails.
 */
export async function chargeAutoTopUp(
  userId: string,
  creditAmount: number,
): Promise<string | null> {
  if (!stripe) return null;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user.stripeCustomerId) {
    console.error(`[Stripe] Auto top-up: No Stripe customer for user ${userId}`);
    return null;
  }

  // Convert credits to cents: 100 credits = $1.00 = 100 cents
  const amountInCents = creditAmount;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      customer: user.stripeCustomerId,
      off_session: true,
      confirm: true,
      description: `Auto top-up: ${creditAmount} credits`,
      metadata: { userId, type: 'auto_topup', credits: String(creditAmount) },
    });

    console.log(`[Stripe] Auto top-up charged $${(amountInCents / 100).toFixed(2)} for user ${userId} (PI: ${paymentIntent.id})`);
    return paymentIntent.id;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Stripe] Auto top-up charge failed for user ${userId}:`, errMsg);
    return null;
  }
}

/**
 * Check if a Stripe customer has a valid default payment method.
 */
export async function hasValidPaymentMethod(userId: string): Promise<boolean> {
  if (!stripe) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) return false;

  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
      limit: 1,
    });
    return paymentMethods.data.length > 0;
  } catch {
    return false;
  }
}

function mapStripeStatus(status: Stripe.Subscription.Status): 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'TRIALING' {
  switch (status) {
    case 'active': return 'ACTIVE';
    case 'past_due': return 'PAST_DUE';
    case 'canceled': return 'CANCELED';
    case 'unpaid': return 'UNPAID';
    case 'trialing': return 'TRIALING';
    default: return 'CANCELED';
  }
}
