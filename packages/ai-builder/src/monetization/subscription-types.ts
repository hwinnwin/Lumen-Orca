/**
 * AI Builder Platform — Monetization & Subscription Types
 *
 * CLEAN, SCALABLE PRICING LOGIC
 *
 * You charge for:
 * - Number of AI objects
 * - Depth of tuning
 * - Memory length
 * - Team sharing
 * - Compliance features
 *
 * This is SaaS + consulting leverage.
 */

// ============================================================================
// SUBSCRIPTION TIERS
// ============================================================================

export type SubscriptionTier = 'free' | 'pro' | 'team' | 'enterprise';

export interface SubscriptionPlan {
  /** Plan identifier */
  id: string;

  /** Tier */
  tier: SubscriptionTier;

  /** Plan name */
  name: string;

  /** Description */
  description: string;

  /** Price per month (USD cents) */
  priceMonthly: number;

  /** Price per year (USD cents) */
  priceYearly: number;

  /** Features included */
  features: PlanFeatures;

  /** Limits */
  limits: PlanLimits;

  /** Whether this is the default free tier */
  isDefault: boolean;

  /** Whether this is featured/recommended */
  isFeatured: boolean;

  /** Sort order */
  sortOrder: number;
}

export interface PlanFeatures {
  /** Number of AI objects allowed */
  aiObjectCount: number;

  /** Depth of tuning available */
  tuningDepth: TuningDepth;

  /** Memory features */
  memory: MemoryFeatures;

  /** Collaboration features */
  collaboration: CollaborationFeatures;

  /** Compliance features */
  compliance: ComplianceFeatures;

  /** Support level */
  support: SupportLevel;

  /** Additional features */
  additionalFeatures: string[];
}

export type TuningDepth = 'basic' | 'standard' | 'advanced' | 'full';

export interface MemoryFeatures {
  /** Session memory enabled */
  sessionMemory: boolean;

  /** Persistent memory enabled */
  persistentMemory: boolean;

  /** Maximum memory items */
  maxMemoryItems: number;

  /** Memory retention days */
  retentionDays: number;
}

export interface CollaborationFeatures {
  /** Team sharing enabled */
  teamSharing: boolean;

  /** Maximum team members */
  maxTeamMembers: number;

  /** Permission management */
  permissions: boolean;

  /** Shared AI library */
  sharedLibrary: boolean;
}

export interface ComplianceFeatures {
  /** Audit logging enabled */
  auditLogs: boolean;

  /** Audit log retention (days) */
  auditRetention: number;

  /** Enterprise SSO */
  sso: boolean;

  /** Custom compliance profiles */
  customCompliance: boolean;

  /** SLA available */
  sla: boolean;
}

export type SupportLevel = 'community' | 'email' | 'priority' | 'dedicated';

export interface PlanLimits {
  /** Maximum API calls per month */
  apiCallsPerMonth: number;

  /** Maximum tokens per AI per month */
  tokensPerAIPerMonth: number;

  /** Maximum team members */
  maxTeamMembers: number;

  /** Maximum AI objects */
  maxAIObjects: number;

  /** Maximum templates */
  maxCustomTemplates: number;
}

// ============================================================================
// SUBSCRIPTION PLANS
// ============================================================================

export const FREE_PLAN: SubscriptionPlan = {
  id: 'free',
  tier: 'free',
  name: 'Free',
  description: 'Get started with AI building',
  priceMonthly: 0,
  priceYearly: 0,
  isDefault: true,
  isFeatured: false,
  sortOrder: 1,
  features: {
    aiObjectCount: 2,
    tuningDepth: 'basic',
    memory: {
      sessionMemory: true,
      persistentMemory: false,
      maxMemoryItems: 50,
      retentionDays: 0,
    },
    collaboration: {
      teamSharing: false,
      maxTeamMembers: 1,
      permissions: false,
      sharedLibrary: false,
    },
    compliance: {
      auditLogs: false,
      auditRetention: 0,
      sso: false,
      customCompliance: false,
      sla: false,
    },
    support: 'community',
    additionalFeatures: [
      'All MVP templates',
      'Basic prompt stack',
      'Standard safety features',
    ],
  },
  limits: {
    apiCallsPerMonth: 1000,
    tokensPerAIPerMonth: 100000,
    maxTeamMembers: 1,
    maxAIObjects: 2,
    maxCustomTemplates: 0,
  },
};

export const PRO_PLAN: SubscriptionPlan = {
  id: 'pro',
  tier: 'pro',
  name: 'Pro',
  description: 'More AIs, deeper control',
  priceMonthly: 2900, // $29/month
  priceYearly: 29000, // $290/year (2 months free)
  isDefault: false,
  isFeatured: true,
  sortOrder: 2,
  features: {
    aiObjectCount: 10,
    tuningDepth: 'advanced',
    memory: {
      sessionMemory: true,
      persistentMemory: true,
      maxMemoryItems: 500,
      retentionDays: 90,
    },
    collaboration: {
      teamSharing: false,
      maxTeamMembers: 1,
      permissions: false,
      sharedLibrary: false,
    },
    compliance: {
      auditLogs: true,
      auditRetention: 30,
      sso: false,
      customCompliance: false,
      sla: false,
    },
    support: 'email',
    additionalFeatures: [
      'All MVP templates',
      'Full prompt stack access',
      'Advanced safety configuration',
      'Priority template suggestions',
      'Version history',
      'AI cloning',
    ],
  },
  limits: {
    apiCallsPerMonth: 10000,
    tokensPerAIPerMonth: 500000,
    maxTeamMembers: 1,
    maxAIObjects: 10,
    maxCustomTemplates: 5,
  },
};

export const TEAM_PLAN: SubscriptionPlan = {
  id: 'team',
  tier: 'team',
  name: 'Team',
  description: 'Shared AIs with permissions',
  priceMonthly: 7900, // $79/month
  priceYearly: 79000, // $790/year (2 months free)
  isDefault: false,
  isFeatured: false,
  sortOrder: 3,
  features: {
    aiObjectCount: 50,
    tuningDepth: 'full',
    memory: {
      sessionMemory: true,
      persistentMemory: true,
      maxMemoryItems: 2000,
      retentionDays: 365,
    },
    collaboration: {
      teamSharing: true,
      maxTeamMembers: 10,
      permissions: true,
      sharedLibrary: true,
    },
    compliance: {
      auditLogs: true,
      auditRetention: 90,
      sso: false,
      customCompliance: false,
      sla: false,
    },
    support: 'priority',
    additionalFeatures: [
      'Everything in Pro',
      'Team workspace',
      'Role-based permissions',
      'Shared AI library',
      'Team analytics',
      'Bulk operations',
    ],
  },
  limits: {
    apiCallsPerMonth: 50000,
    tokensPerAIPerMonth: 1000000,
    maxTeamMembers: 10,
    maxAIObjects: 50,
    maxCustomTemplates: 20,
  },
};

export const ENTERPRISE_PLAN: SubscriptionPlan = {
  id: 'enterprise',
  tier: 'enterprise',
  name: 'Enterprise',
  description: 'Full compliance with SLAs',
  priceMonthly: 0, // Custom pricing
  priceYearly: 0, // Custom pricing
  isDefault: false,
  isFeatured: false,
  sortOrder: 4,
  features: {
    aiObjectCount: -1, // Unlimited
    tuningDepth: 'full',
    memory: {
      sessionMemory: true,
      persistentMemory: true,
      maxMemoryItems: -1, // Unlimited
      retentionDays: -1, // Custom
    },
    collaboration: {
      teamSharing: true,
      maxTeamMembers: -1, // Unlimited
      permissions: true,
      sharedLibrary: true,
    },
    compliance: {
      auditLogs: true,
      auditRetention: 730, // 2 years
      sso: true,
      customCompliance: true,
      sla: true,
    },
    support: 'dedicated',
    additionalFeatures: [
      'Everything in Team',
      'Unlimited AI objects',
      'Enterprise SSO (SAML, OIDC)',
      'Custom compliance profiles',
      '99.9% SLA',
      'Dedicated account manager',
      'Custom integrations',
      'On-premises option',
    ],
  },
  limits: {
    apiCallsPerMonth: -1, // Unlimited
    tokensPerAIPerMonth: -1, // Unlimited
    maxTeamMembers: -1, // Unlimited
    maxAIObjects: -1, // Unlimited
    maxCustomTemplates: -1, // Unlimited
  },
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  FREE_PLAN,
  PRO_PLAN,
  TEAM_PLAN,
  ENTERPRISE_PLAN,
];

// ============================================================================
// UPSELLS & ADD-ONS
// ============================================================================

export interface AddOn {
  /** Add-on identifier */
  id: string;

  /** Name */
  name: string;

  /** Description */
  description: string;

  /** Price (USD cents) */
  price: number;

  /** Pricing model */
  pricingModel: 'one_time' | 'monthly' | 'per_use';

  /** Minimum tier required */
  minimumTier: SubscriptionTier;

  /** What the add-on provides */
  provides: string[];
}

export const ADD_ONS: AddOn[] = [
  {
    id: 'prompt_review',
    name: 'Prompt Architecture Review',
    description: 'Expert review of your AI configurations with recommendations',
    price: 29900, // $299
    pricingModel: 'one_time',
    minimumTier: 'pro',
    provides: [
      'Full configuration audit',
      'Performance recommendations',
      'Safety review',
      'Optimization suggestions',
      'Written report',
    ],
  },
  {
    id: 'custom_ai_design',
    name: 'Custom AI Design',
    description: 'Have our team design a custom AI for your specific needs',
    price: 99900, // $999
    pricingModel: 'one_time',
    minimumTier: 'pro',
    provides: [
      'Requirements consultation',
      'Custom prompt engineering',
      'Behavior testing',
      'Documentation',
      '30-day support',
    ],
  },
  {
    id: 'behavior_audit',
    name: 'Behavior Audit',
    description: 'Comprehensive audit of AI behavior with compliance verification',
    price: 49900, // $499
    pricingModel: 'one_time',
    minimumTier: 'team',
    provides: [
      'Full behavior analysis',
      'Compliance verification',
      'Risk assessment',
      'Remediation plan',
      'Certification document',
    ],
  },
  {
    id: 'additional_ai_objects',
    name: 'Additional AI Objects',
    description: 'Add more AI objects to your plan',
    price: 500, // $5/month per AI
    pricingModel: 'monthly',
    minimumTier: 'pro',
    provides: [
      '1 additional AI object',
    ],
  },
  {
    id: 'additional_team_seats',
    name: 'Additional Team Seats',
    description: 'Add more team members',
    price: 1500, // $15/month per seat
    pricingModel: 'monthly',
    minimumTier: 'team',
    provides: [
      '1 additional team member seat',
    ],
  },
];

// ============================================================================
// USAGE TRACKING
// ============================================================================

export interface UsageRecord {
  /** User/Team ID */
  ownerId: string;

  /** Billing period start */
  periodStart: Date;

  /** Billing period end */
  periodEnd: Date;

  /** API calls used */
  apiCallsUsed: number;

  /** Tokens used per AI */
  tokensUsedPerAI: Record<string, number>;

  /** Total tokens used */
  totalTokensUsed: number;

  /** AI objects count */
  aiObjectsCount: number;

  /** Team members count */
  teamMembersCount: number;
}

export interface UsageQuota {
  /** Resource name */
  resource: string;

  /** Current usage */
  used: number;

  /** Limit (-1 = unlimited) */
  limit: number;

  /** Usage percentage */
  percentage: number;

  /** Warning threshold reached */
  warning: boolean;

  /** Limit reached */
  exceeded: boolean;
}

// ============================================================================
// SUBSCRIPTION STATE
// ============================================================================

export interface Subscription {
  /** Subscription ID */
  id: string;

  /** Owner ID */
  ownerId: string;

  /** Current plan */
  plan: SubscriptionPlan;

  /** Status */
  status: SubscriptionStatus;

  /** Billing cycle */
  billingCycle: 'monthly' | 'yearly';

  /** Current period start */
  currentPeriodStart: Date;

  /** Current period end */
  currentPeriodEnd: Date;

  /** Active add-ons */
  addOns: ActiveAddOn[];

  /** Payment method on file */
  hasPaymentMethod: boolean;

  /** Created timestamp */
  createdAt: Date;

  /** Updated timestamp */
  updatedAt: Date;
}

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid';

export interface ActiveAddOn {
  /** Add-on definition */
  addOn: AddOn;

  /** Quantity */
  quantity: number;

  /** Activated timestamp */
  activatedAt: Date;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(p => p.id === planId);
}

export function getPlanByTier(tier: SubscriptionTier): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(p => p.tier === tier);
}

export function getAddOnById(addOnId: string): AddOn | undefined {
  return ADD_ONS.find(a => a.id === addOnId);
}

export function calculateMonthlyPrice(plan: SubscriptionPlan, yearly: boolean): number {
  if (yearly) {
    return Math.round(plan.priceYearly / 12);
  }
  return plan.priceMonthly;
}

export function calculateUsageQuotas(
  subscription: Subscription,
  usage: UsageRecord
): UsageQuota[] {
  const plan = subscription.plan;
  const quotas: UsageQuota[] = [];

  // API Calls
  const apiLimit = plan.limits.apiCallsPerMonth;
  quotas.push({
    resource: 'API Calls',
    used: usage.apiCallsUsed,
    limit: apiLimit,
    percentage: apiLimit === -1 ? 0 : Math.round((usage.apiCallsUsed / apiLimit) * 100),
    warning: apiLimit !== -1 && usage.apiCallsUsed >= apiLimit * 0.8,
    exceeded: apiLimit !== -1 && usage.apiCallsUsed >= apiLimit,
  });

  // AI Objects
  const aiLimit = plan.limits.maxAIObjects;
  quotas.push({
    resource: 'AI Objects',
    used: usage.aiObjectsCount,
    limit: aiLimit,
    percentage: aiLimit === -1 ? 0 : Math.round((usage.aiObjectsCount / aiLimit) * 100),
    warning: aiLimit !== -1 && usage.aiObjectsCount >= aiLimit * 0.8,
    exceeded: aiLimit !== -1 && usage.aiObjectsCount >= aiLimit,
  });

  // Team Members
  const teamLimit = plan.limits.maxTeamMembers;
  quotas.push({
    resource: 'Team Members',
    used: usage.teamMembersCount,
    limit: teamLimit,
    percentage: teamLimit === -1 ? 0 : Math.round((usage.teamMembersCount / teamLimit) * 100),
    warning: teamLimit !== -1 && usage.teamMembersCount >= teamLimit * 0.8,
    exceeded: teamLimit !== -1 && usage.teamMembersCount >= teamLimit,
  });

  return quotas;
}

export function canUpgrade(
  currentTier: SubscriptionTier,
  targetTier: SubscriptionTier
): boolean {
  const tierOrder: SubscriptionTier[] = ['free', 'pro', 'team', 'enterprise'];
  const currentIndex = tierOrder.indexOf(currentTier);
  const targetIndex = tierOrder.indexOf(targetTier);
  return targetIndex > currentIndex;
}

export function canDowngrade(
  currentTier: SubscriptionTier,
  targetTier: SubscriptionTier
): boolean {
  const tierOrder: SubscriptionTier[] = ['free', 'pro', 'team', 'enterprise'];
  const currentIndex = tierOrder.indexOf(currentTier);
  const targetIndex = tierOrder.indexOf(targetTier);
  return targetIndex < currentIndex && targetTier !== 'free'; // Can't downgrade to free from paid
}

export function formatPrice(cents: number): string {
  if (cents === 0) return 'Free';
  return `$${(cents / 100).toFixed(0)}`;
}

export function formatPriceWithCents(cents: number): string {
  if (cents === 0) return 'Free';
  return `$${(cents / 100).toFixed(2)}`;
}
