/**
 * NoMoreHunger Type Definitions
 *
 * Core types for the distributed food redistribution network.
 * Protocol 69: Never take. Always give back more.
 */

// ============================================================================
// NODE TYPES - The Dragon's Scales (Distributed Computing)
// ============================================================================

export type NodeStatus = 'dormant' | 'active' | 'contributing' | 'offline';

export interface ComputeNode {
  nodeId: string;
  userId: string;
  status: NodeStatus;
  contributionMode: 'volunteer' | 'earn';
  metrics: NodeMetrics;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface NodeMetrics {
  cpuCyclesContributed: number;
  batteryUsedPercent: number;
  dataTransferredMb: number;
  uptimeMinutes: number;
  creditsEarned: number;
}

// ============================================================================
// HUNGER ASSESSMENT TYPES - The Priority Engine
// ============================================================================

export type HungerLevel = 'okay' | 'getting_hungry' | 'very_hungry' | 'havent_eaten';
export type LastMealTime = 'today' | 'yesterday' | 'two_plus_days' | 'cant_remember';
export type HouseholdType = 'just_me' | 'kids_at_home' | 'elderly_dependent' | 'multiple_mouths';

export interface HungerAssessment {
  assessmentId: string;
  userId: string;
  hungerLevel: HungerLevel;
  lastMealTime: LastMealTime;
  householdType: HouseholdType;
  location: GeoLocation;
  timestamp: Date;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface PriorityScore {
  total: number;
  needWeight: number;      // 70% of score
  proximityWeight: number; // 30% of score
  queuePosition: number;
  estimatedWaitMinutes: number;
}

// ============================================================================
// CREDIT ECONOMY TYPES - The Dragon's Treasure
// ============================================================================

export type CreditActionType =
  | 'node_contribution'      // 1 NMH per compute hour
  | 'food_delivery'          // 5 NMH per delivery
  | 'source_mapped'          // 10 NMH per verified source
  | 'depot_hosting'          // 20 NMH per month
  | 'grower_contribution';   // 15 NMH per month

export type CreditRedemptionType =
  | 'hodl'           // Cash out later when funded
  | 'gift'           // Transfer to another member
  | 'pass_forward';  // Donate back to the system

export interface Credit {
  creditId: string;
  userId: string;
  amount: number;
  actionType: CreditActionType;
  earnedAt: Date;
  redeemed: boolean;
  redemptionType?: CreditRedemptionType;
  redeemedAt?: Date;
}

export interface CreditWallet {
  userId: string;
  totalEarned: number;
  totalRedeemed: number;
  balance: number;
  credits: Credit[];
}

// ============================================================================
// FOOD FLOW TYPES - The Dragon's Blood (Logistics)
// ============================================================================

export type FoodSourceType = 'restaurant' | 'grocery' | 'farm' | 'event' | 'home_garden';
export type DepotTier = 'hub' | 'mini_depot' | 'home_node';
export type CarrierStatus = 'available' | 'en_route' | 'delivering' | 'offline';
export type FoodStatus = 'available' | 'claimed' | 'in_transit' | 'delivered' | 'expired';

export interface FoodSource {
  sourceId: string;
  type: FoodSourceType;
  name: string;
  location: GeoLocation;
  verified: boolean;
  mappedBy: string;        // userId who mapped this
  mappedAt: Date;
  reliability: number;     // 0-1 score based on history
}

export interface FoodItem {
  itemId: string;
  sourceId: string;
  description: string;
  quantity: number;
  unit: string;
  freshnessWindow: {
    availableAt: Date;
    expiresAt: Date;
  };
  status: FoodStatus;
  claimedBy?: string;
  deliveredAt?: Date;
}

export interface Depot {
  depotId: string;
  tier: DepotTier;
  hostUserId: string;
  name: string;
  location: GeoLocation;
  capacity: number;
  currentStock: number;
  operatingHours?: {
    open: string;   // HH:MM format
    close: string;
  };
  createdAt: Date;
}

export interface Carrier {
  carrierId: string;
  userId: string;
  status: CarrierStatus;
  location: GeoLocation;
  transportMode: 'walking' | 'cycling' | 'driving';
  currentDeliveryId?: string;
  completedDeliveries: number;
  rating: number;          // 0-5 stars
}

export interface DeliveryRoute {
  routeId: string;
  carrierId: string;
  sourceId: string;
  destinationId: string;   // depotId or userId
  items: FoodItem[];
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  estimatedDuration: number;  // minutes
  actualDuration?: number;
  distance: number;           // kilometers
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// ============================================================================
// PARTICIPANT ROLES
// ============================================================================

export type Role = 'node' | 'carrier' | 'depot_host' | 'mapper' | 'grower' | 'recipient';

export interface Participant {
  userId: string;
  roles: Role[];
  displayName?: string;
  location?: GeoLocation;
  joinedAt: Date;
  impactMetrics: ImpactMetrics;
  creditWallet: CreditWallet;
}

export interface ImpactMetrics {
  mealsContributed: number;
  mealsReceived: number;
  deliveriesCompleted: number;
  sourcesMapped: number;
  computeHoursContributed: number;
  communityKarma: number;    // Positive-only, based on generosity
}

// ============================================================================
// SYSTEM EVENTS
// ============================================================================

export type SystemEventType =
  | 'node_joined'
  | 'node_left'
  | 'food_available'
  | 'food_claimed'
  | 'delivery_started'
  | 'delivery_completed'
  | 'credit_earned'
  | 'credit_redeemed'
  | 'source_mapped'
  | 'depot_registered';

export interface SystemEvent {
  eventId: string;
  type: SystemEventType;
  timestamp: Date;
  actorId: string;
  payload: Record<string, unknown>;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: Date;
}

export interface QueueMessage {
  recipientId: string;
  position: number;
  waitMinutes: number;
  message: string;  // Gentle, human message
}
