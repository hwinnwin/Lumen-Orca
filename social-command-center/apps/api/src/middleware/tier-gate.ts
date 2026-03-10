import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client.js';
import { hasTierAccess } from '../services/stripe.js';

/**
 * Middleware factory that gates route access by subscription tier.
 *
 * Usage:
 *   router.get('/analytics', requireTier('PRO'), handler);
 */
export function requireTier(minimumTier: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { tier: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!hasTierAccess(user.tier, minimumTier)) {
        return res.status(403).json({
          error: `This feature requires a ${minimumTier} subscription or higher`,
          code: 'TIER_REQUIRED',
          requiredTier: minimumTier,
          currentTier: user.tier,
        });
      }

      next();
    } catch (error) {
      console.error('[TierGate] Failed to check user tier:', error);
      res.status(500).json({ error: 'Failed to verify subscription tier' });
    }
  };
}
