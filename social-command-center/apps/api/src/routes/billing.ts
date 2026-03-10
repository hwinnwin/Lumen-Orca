import { Router } from 'express';
import express from 'express';
import { env } from '../config/env.js';
import { prisma } from '../db/client.js';
import {
  stripe,
  createCheckoutSession,
  createPortalSession,
  syncSubscription,
  getCreditBonusRate,
  getMonthlyCredits,
  grantMonthlyCredits,
  hasValidPaymentMethod,
  tierFromPriceId,
} from '../services/stripe.js';
import { authMiddleware } from '../middleware/auth.js';

export const billingRouter = Router();

// ─── Protected Routes (JWT required) ────────────────────

// Get current subscription status
billingRouter.get('/subscription', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { tier: true, subscription: true, creditBalance: { select: { autoTopUpEnabled: true, autoTopUpThreshold: true, autoTopUpAmount: true } } },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const monthlyCredits = getMonthlyCredits(user.tier);

    res.json({
      data: {
        tier: user.tier,
        subscription: user.subscription
          ? {
              status: user.subscription.status,
              currentPeriodEnd: user.subscription.currentPeriodEnd.toISOString(),
              cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
            }
          : null,
        bonusRate: getCreditBonusRate(user.tier),
        monthlyCredits,
        autoTopUp: {
          enabled: user.creditBalance?.autoTopUpEnabled ?? false,
          threshold: user.creditBalance?.autoTopUpThreshold ?? 100,
          amount: user.creditBalance?.autoTopUpAmount ?? 1000,
        },
      },
    });
  } catch (error) {
    console.error('[Billing] Subscription fetch failed:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Create checkout session
billingRouter.post('/checkout', authMiddleware, async (req, res) => {
  try {
    const { tier } = req.body as { tier: string };

    if (!['PRO', 'PREMIUM', 'POWER'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier. Must be PRO, PREMIUM, or POWER.' });
    }

    if (!env.STRIPE_SECRET_KEY) {
      return res.status(501).json({ error: 'Stripe is not configured' });
    }

    const url = await createCheckoutSession(req.userId, tier);
    res.json({ data: { url } });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Billing] Checkout failed:', errMsg);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create customer portal session
billingRouter.post('/portal', authMiddleware, async (req, res) => {
  try {
    if (!env.STRIPE_SECRET_KEY) {
      return res.status(501).json({ error: 'Stripe is not configured' });
    }

    const url = await createPortalSession(req.userId);
    res.json({ data: { url } });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Billing] Portal failed:', errMsg);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// Cancel subscription (downgrade to Free at period end)
billingRouter.post('/cancel', authMiddleware, async (req, res) => {
  try {
    if (!env.STRIPE_SECRET_KEY) {
      return res.status(501).json({ error: 'Stripe is not configured' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.userId },
      select: { stripeSubscriptionId: true, status: true },
    });

    if (!subscription || subscription.status === 'CANCELED') {
      return res.status(400).json({ error: 'No active subscription to cancel' });
    }

    // Cancel at end of billing period (user keeps access until then)
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update local record
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.stripeSubscriptionId },
      data: { cancelAtPeriodEnd: true },
    });

    console.log(`[Billing] Subscription cancel requested for user ${req.userId}`);
    res.json({ data: { message: 'Subscription will cancel at end of billing period' } });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Billing] Cancel failed:', errMsg);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Resume a subscription that was set to cancel at period end
billingRouter.post('/resume', authMiddleware, async (req, res) => {
  try {
    if (!env.STRIPE_SECRET_KEY) {
      return res.status(501).json({ error: 'Stripe is not configured' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.userId },
      select: { stripeSubscriptionId: true, cancelAtPeriodEnd: true },
    });

    if (!subscription || !subscription.cancelAtPeriodEnd) {
      return res.status(400).json({ error: 'No pending cancellation to resume' });
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.stripeSubscriptionId },
      data: { cancelAtPeriodEnd: false },
    });

    console.log(`[Billing] Subscription resumed for user ${req.userId}`);
    res.json({ data: { message: 'Subscription resumed' } });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Billing] Resume failed:', errMsg);
    res.status(500).json({ error: 'Failed to resume subscription' });
  }
});

// ─── Auto Top-Up Settings ───────────────────────────────

// Get auto top-up settings
billingRouter.get('/auto-topup', authMiddleware, async (req, res) => {
  try {
    const creditBalance = await prisma.creditBalance.findUnique({
      where: { userId: req.userId },
      select: {
        autoTopUpEnabled: true,
        autoTopUpThreshold: true,
        autoTopUpAmount: true,
      },
    });

    const paymentMethodValid = await hasValidPaymentMethod(req.userId);

    res.json({
      data: {
        enabled: creditBalance?.autoTopUpEnabled ?? false,
        threshold: creditBalance?.autoTopUpThreshold ?? 100,
        amount: creditBalance?.autoTopUpAmount ?? 1000,
        hasPaymentMethod: paymentMethodValid,
      },
    });
  } catch (error) {
    console.error('[Billing] Auto top-up settings fetch failed:', error);
    res.status(500).json({ error: 'Failed to fetch auto top-up settings' });
  }
});

// Update auto top-up settings (enable/disable + configure)
billingRouter.post('/auto-topup', authMiddleware, async (req, res) => {
  try {
    const { enabled, threshold, amount } = req.body as {
      enabled: boolean;
      threshold?: number;
      amount?: number;
    };

    // If enabling, verify the user has a valid payment method
    if (enabled) {
      const paymentMethodValid = await hasValidPaymentMethod(req.userId);
      if (!paymentMethodValid) {
        return res.status(400).json({
          error: 'No valid payment method on file. Please add a card via Manage Billing first.',
          code: 'NO_PAYMENT_METHOD',
        });
      }
    }

    // Validate amounts
    const topUpThreshold = Math.max(0, Math.min(threshold ?? 100, 10000));
    const topUpAmount = Math.max(500, Math.min(amount ?? 1000, 50000)); // $5 min, $500 max

    // Ensure credit balance exists
    let creditBalance = await prisma.creditBalance.findUnique({ where: { userId: req.userId } });
    if (!creditBalance) {
      // Import getOrCreateBalance dynamically to avoid circular imports
      const { getOrCreateBalance } = await import('../services/credits.js');
      creditBalance = await getOrCreateBalance(req.userId);
    }

    await prisma.creditBalance.update({
      where: { userId: req.userId },
      data: {
        autoTopUpEnabled: enabled,
        autoTopUpThreshold: topUpThreshold,
        autoTopUpAmount: topUpAmount,
      },
    });

    console.log(`[Billing] Auto top-up ${enabled ? 'enabled' : 'disabled'} for user ${req.userId} (threshold=${topUpThreshold}, amount=${topUpAmount})`);

    res.json({
      data: {
        enabled,
        threshold: topUpThreshold,
        amount: topUpAmount,
      },
    });
  } catch (error) {
    console.error('[Billing] Auto top-up update failed:', error);
    res.status(500).json({ error: 'Failed to update auto top-up settings' });
  }
});

// ─── Stripe Webhook (NO auth — verified by Stripe signature) ──

billingRouter.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;

    if (!env.STRIPE_WEBHOOK_SECRET) {
      console.error('[Stripe] Webhook secret not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[Stripe] Webhook signature verification failed:', errMsg);
      return res.status(400).json({ error: `Webhook Error: ${errMsg}` });
    }

    console.log(`[Stripe] Webhook received: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          if (session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(
              session.subscription as string,
            );
            await syncSubscription(subscription);
          }
          break;
        }

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          await syncSubscription(subscription as unknown as import('stripe').default.Subscription);
          break;
        }

        case 'invoice.paid': {
          // Grant monthly subscription credits on each paid invoice (new billing cycle)
          const paidInvoice = event.data.object as any;
          if (paidInvoice.subscription && paidInvoice.customer) {
            try {
              // Look up the user by Stripe customer ID
              const user = await prisma.user.findFirst({
                where: { stripeCustomerId: paidInvoice.customer as string },
                select: { id: true, tier: true },
              });
              if (user && user.tier !== 'FREE') {
                await grantMonthlyCredits(user.id, user.tier);
              }
            } catch (grantErr) {
              console.error('[Stripe] Failed to grant monthly credits:', grantErr);
            }
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object;
          console.warn(`[Stripe] Payment failed for customer ${invoice.customer}`);
          break;
        }

        default:
          console.log(`[Stripe] Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`[Stripe] Webhook handler error for ${event.type}:`, error);
    }

    res.json({ received: true });
  },
);
