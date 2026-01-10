/**
 * NoMoreHunger Credit Engine
 *
 * THE DRAGON'S TREASURE
 *
 * Philosophy:
 * - Credits are a PROMISE: "When we have the means, we honor this"
 * - The volunteers aren't charity workers. They're founding members.
 * - First money goes to honoring credits - our people come first.
 *
 * Protocol 69: Never take. Always give back more.
 */

import type {
  Credit,
  CreditWallet,
  CreditActionType,
  CreditRedemptionType,
} from '../types';

// ============================================================================
// CREDIT RATES
// ============================================================================

/**
 * NMH Credit earning rates
 * These are the promises we make.
 */
export const CREDIT_RATES: Record<CreditActionType, number> = {
  node_contribution: 1,      // 1 NMH per compute hour
  food_delivery: 5,          // 5 NMH per completed delivery
  source_mapped: 10,         // 10 NMH per verified food source
  depot_hosting: 20,         // 20 NMH per month as depot host
  grower_contribution: 15,   // 15 NMH per month as registered grower
};

/**
 * Credit rate descriptions for transparency
 */
export const CREDIT_DESCRIPTIONS: Record<CreditActionType, string> = {
  node_contribution: '1 NMH per hour of compute power shared',
  food_delivery: '5 NMH per successful food delivery',
  source_mapped: '10 NMH for each verified food source you map',
  depot_hosting: '20 NMH monthly for hosting a community depot',
  grower_contribution: '15 NMH monthly for registered food growing',
};

// ============================================================================
// CREDIT GENERATION
// ============================================================================

/**
 * Generate a unique credit ID
 */
function generateCreditId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `nmh_${timestamp}_${random}`;
}

/**
 * Create a new credit for an action
 */
export function createCredit(
  userId: string,
  actionType: CreditActionType,
  multiplier: number = 1
): Credit {
  const baseAmount = CREDIT_RATES[actionType];
  const amount = baseAmount * multiplier;

  return {
    creditId: generateCreditId(),
    userId,
    amount,
    actionType,
    earnedAt: new Date(),
    redeemed: false,
  };
}

/**
 * Calculate credits for compute node contribution
 * @param uptimeMinutes - Minutes the node was active and contributing
 */
export function calculateNodeCredits(uptimeMinutes: number): number {
  // 1 NMH per hour, pro-rated
  return (uptimeMinutes / 60) * CREDIT_RATES.node_contribution;
}

/**
 * Calculate credits for depot hosting
 * @param daysActive - Days the depot has been active this month
 */
export function calculateDepotCredits(daysActive: number): number {
  // 20 NMH per month, pro-rated by days
  const daysInMonth = 30; // Simplified
  return (daysActive / daysInMonth) * CREDIT_RATES.depot_hosting;
}

// ============================================================================
// WALLET MANAGEMENT
// ============================================================================

/**
 * Create an empty wallet for a new user
 */
export function createWallet(userId: string): CreditWallet {
  return {
    userId,
    totalEarned: 0,
    totalRedeemed: 0,
    balance: 0,
    credits: [],
  };
}

/**
 * Add a credit to a wallet
 */
export function addCreditToWallet(
  wallet: CreditWallet,
  credit: Credit
): CreditWallet {
  return {
    ...wallet,
    totalEarned: wallet.totalEarned + credit.amount,
    balance: wallet.balance + credit.amount,
    credits: [...wallet.credits, credit],
  };
}

/**
 * Redeem credits from a wallet
 */
export function redeemCredits(
  wallet: CreditWallet,
  amount: number,
  redemptionType: CreditRedemptionType
): { wallet: CreditWallet; success: boolean; message: string } {
  if (amount > wallet.balance) {
    return {
      wallet,
      success: false,
      message: `Insufficient balance. You have ${wallet.balance} NMH, tried to redeem ${amount}.`,
    };
  }

  // Mark credits as redeemed (FIFO - oldest first)
  let remaining = amount;
  const updatedCredits = wallet.credits.map((credit) => {
    if (remaining <= 0 || credit.redeemed) return credit;

    const toRedeem = Math.min(credit.amount, remaining);
    remaining -= toRedeem;

    if (toRedeem >= credit.amount) {
      // Fully redeemed
      return {
        ...credit,
        redeemed: true,
        redemptionType,
        redeemedAt: new Date(),
      };
    }
    return credit;
  });

  const updatedWallet: CreditWallet = {
    ...wallet,
    totalRedeemed: wallet.totalRedeemed + amount,
    balance: wallet.balance - amount,
    credits: updatedCredits,
  };

  const messages: Record<CreditRedemptionType, string> = {
    hodl: `${amount} NMH marked for cash out when funding arrives. We honor our promises.`,
    gift: `${amount} NMH transferred. Your generosity strengthens our community.`,
    pass_forward: `${amount} NMH donated back to the system. Protocol 69 in action.`,
  };

  return {
    wallet: updatedWallet,
    success: true,
    message: messages[redemptionType],
  };
}

// ============================================================================
// STATISTICS & REPORTING
// ============================================================================

/**
 * Get wallet statistics for display
 */
export interface WalletStats {
  totalEarned: number;
  totalRedeemed: number;
  balance: number;
  breakdown: Record<CreditActionType, number>;
  mostRecentAction?: CreditActionType;
  mostRecentDate?: Date;
}

export function getWalletStats(wallet: CreditWallet): WalletStats {
  // Calculate breakdown by action type
  const breakdown: Record<CreditActionType, number> = {
    node_contribution: 0,
    food_delivery: 0,
    source_mapped: 0,
    depot_hosting: 0,
    grower_contribution: 0,
  };

  let mostRecentCredit: Credit | undefined;

  wallet.credits.forEach((credit) => {
    breakdown[credit.actionType] += credit.amount;
    if (!mostRecentCredit || credit.earnedAt > mostRecentCredit.earnedAt) {
      mostRecentCredit = credit;
    }
  });

  return {
    totalEarned: wallet.totalEarned,
    totalRedeemed: wallet.totalRedeemed,
    balance: wallet.balance,
    breakdown,
    mostRecentAction: mostRecentCredit?.actionType,
    mostRecentDate: mostRecentCredit?.earnedAt,
  };
}

// ============================================================================
// THE PROMISE
// ============================================================================

/**
 * The NoMoreHunger Promise
 * This is displayed to every user who earns credits.
 */
export const THE_PROMISE = `
Every credit earned is a debt of honor.

When NoMoreHunger receives funding - through grants, partnerships,
or community support - we pay our people first.

You're not just volunteering.
You're becoming a founding member of a movement.

The credits you earn today will be honored tomorrow.

This is our promise. This is Protocol 69.
Never take. Always give back more.
`.trim();

/**
 * Generate a personalized promise message
 */
export function generatePromiseMessage(
  userName: string,
  totalCredits: number
): string {
  return `
${userName}, you have earned ${totalCredits.toFixed(2)} NMH credits.

${THE_PROMISE}

Thank you for being part of ending hunger.
`.trim();
}
