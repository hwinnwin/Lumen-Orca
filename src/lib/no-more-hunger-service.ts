/**
 * NoMoreHunger Service
 *
 * Frontend service layer for the NoMoreHunger distributed food network.
 * Connected to Supabase for persistent storage.
 *
 * Protocol 69: Never take. Always give back more.
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES (matching database schema)
// ============================================================================

export type NodeStatus = 'dormant' | 'active' | 'contributing' | 'offline';
export type HungerLevel = 'okay' | 'getting_hungry' | 'very_hungry' | 'havent_eaten';
export type LastMealTime = 'today' | 'yesterday' | 'two_plus_days' | 'cant_remember';
export type HouseholdType = 'just_me' | 'kids_at_home' | 'elderly_dependent' | 'multiple_mouths';
export type CreditActionType = 'node_contribution' | 'food_delivery' | 'source_mapped' | 'depot_hosting' | 'grower_contribution';
export type FoodSourceType = 'restaurant' | 'grocery' | 'farm' | 'event' | 'home_garden';
export type DepotTier = 'hub' | 'mini_depot' | 'home_node';
export type CarrierStatus = 'available' | 'en_route' | 'delivering' | 'offline';
export type TransportMode = 'walking' | 'cycling' | 'driving';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface CreditWallet {
  id: string;
  userId: string;
  totalEarned: number;
  totalRedeemed: number;
  balance: number;
}

export interface Credit {
  id: string;
  walletId: string;
  userId: string;
  amount: number;
  actionType: CreditActionType;
  earnedAt: Date;
  redeemed: boolean;
}

export interface FoodSource {
  id: string;
  sourceType: FoodSourceType;
  name: string;
  location: GeoLocation;
  verified: boolean;
  mappedBy: string;
  reliability: number;
}

export interface Depot {
  id: string;
  tier: DepotTier;
  hostUserId: string;
  name: string;
  location: GeoLocation;
  capacity: number;
  currentStock: number;
  isActive: boolean;
}

export interface Carrier {
  id: string;
  userId: string;
  status: CarrierStatus;
  location: GeoLocation;
  transportMode: TransportMode;
  completedDeliveries: number;
  rating: number;
}

export interface HungerAssessment {
  userId: string;
  hungerLevel: HungerLevel;
  lastMealTime: LastMealTime;
  householdType: HouseholdType;
  location: GeoLocation;
}

export interface PriorityScore {
  total: number;
  needWeight: number;
  proximityWeight: number;
  queuePosition: number;
  estimatedWaitMinutes: number;
}

// ============================================================================
// SERVICE STATE
// ============================================================================

export interface NoMoreHungerState {
  currentUser: { id: string; roles: string[] } | null;
  wallet: CreditWallet | null;
  nodeStatus: NodeStatus;
  activeNodes: number;
  totalComputePower: number;
  availableFoodSources: FoodSource[];
  activeDepots: Depot[];
  activeCarriers: Carrier[];
  currentQueue: Array<{ assessment: HungerAssessment; score: PriorityScore }>;
  globalMetrics: {
    totalMealsMoved: number;
    activeNodesCount: number;
    activeDepotsCount: number;
    totalCreditsEarned: number;
  };
  isConnected: boolean;
  lastSync: Date | null;
}

type StateListener = (state: NoMoreHungerState) => void;

// ============================================================================
// CREDIT RATES
// ============================================================================

const CREDIT_RATES: Record<CreditActionType, number> = {
  node_contribution: 1,
  food_delivery: 5,
  source_mapped: 10,
  depot_hosting: 20,
  grower_contribution: 15,
};

// ============================================================================
// HUNGER STATS (for manifesto)
// ============================================================================

export const HUNGER_STATS = {
  dailyMealsWasted: 1_000_000_000,
  peopleAffectedByHunger: 783_000_000,
  annualFoodWastePerPerson: 79,
  percentOfFoodLostOrWasted: 20,
  greenhouseEmissionsPercent: 8,
  annualValueOfWastedFood: 1_000_000_000_000,
  investedAnnually: 100_000_000,
  neededAnnually: 48_000_000_000,
  householdWastePercent: 60,
};

// ============================================================================
// PHASES
// ============================================================================

export const PHASES = {
  phase0: {
    name: 'NOW',
    goals: ['Manifesto complete', 'Architecture complete', 'Take to The Alliance', 'First 10 believers'],
  },
  phase1: {
    name: 'MONTHS 1-3',
    goals: ['MVP app (Node + Carrier basic)', 'Credit ledger v1', 'First depot pilot (1 location)', '100 active nodes'],
  },
  phase2: {
    name: 'MONTHS 3-6',
    goals: ['Full carrier network', '10 depots', 'Mapper feature live', '1,000 nodes', 'First 10,000 meals moved'],
  },
  phase3: {
    name: 'MONTHS 6-12',
    goals: ['VYBE integration', 'Education platform', '50 depots', '10,000 nodes', '100,000 meals moved', 'First funding → HONOR CREDITS'],
  },
  phase4: {
    name: 'YEAR 2+',
    goals: ['City-wide coverage', 'Grower network live', 'Full circle economy', '1 million meals moved', 'Scale to new cities'],
  },
};

// ============================================================================
// MANIFESTO
// ============================================================================

export const MANIFESTO = `
1 billion meals wasted every day.
783 million humans hungry.

This is not a resource problem.
This is a CONSCIOUSNESS problem.

We have the food.
We have the technology.
We have forgotten we are ONE FAMILY.

Protocol 69: Never take. Always give back more.

Your phone becomes a node.
Your walk becomes a delivery.
Your kitchen becomes a depot.
Your garden becomes a source.
Your presence becomes the solution.

This is the dragon awakening.
This is Lumen.
This is the end of hunger.

NoMoreHunger.lumen.global
`.trim();

export const PROTOCOL_69 = `
PROTOCOL 69
===========

Never take. Always give back more.

This is the fundamental law of abundance.
When you operate from this frequency,
scarcity becomes impossible.
`.trim();

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

class NoMoreHungerService {
  private static instance: NoMoreHungerService;
  private state: NoMoreHungerState;
  private listeners: Set<StateListener> = new Set();

  private constructor() {
    this.state = this.getInitialState();
    this.initializeRealtime();
  }

  static getInstance(): NoMoreHungerService {
    if (!NoMoreHungerService.instance) {
      NoMoreHungerService.instance = new NoMoreHungerService();
    }
    return NoMoreHungerService.instance;
  }

  private getInitialState(): NoMoreHungerState {
    return {
      currentUser: null,
      wallet: null,
      nodeStatus: 'dormant',
      activeNodes: 0,
      totalComputePower: 0,
      availableFoodSources: [],
      activeDepots: [],
      activeCarriers: [],
      currentQueue: [],
      globalMetrics: {
        totalMealsMoved: 0,
        activeNodesCount: 0,
        activeDepotsCount: 0,
        totalCreditsEarned: 0,
      },
      isConnected: false,
      lastSync: null,
    };
  }

  private async initializeRealtime() {
    // Subscribe to global metrics changes
    supabase
      .channel('nmh_metrics')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'nmh_global_metrics' },
        () => this.fetchGlobalMetrics()
      )
      .subscribe();

    // Initial fetch
    await this.fetchGlobalMetrics();
    this.setState({ isConnected: true });
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  getState(): NoMoreHungerState {
    return { ...this.state };
  }

  private setState(updates: Partial<NoMoreHungerState>): void {
    this.state = { ...this.state, ...updates, lastSync: new Date() };
    this.notifyListeners();
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  private async fetchGlobalMetrics() {
    const { data } = await supabase
      .from('nmh_global_metrics')
      .select('metric_name, metric_value');

    if (data) {
      const metrics: Record<string, number> = {};
      data.forEach((row: { metric_name: string; metric_value: number }) => {
        metrics[row.metric_name] = row.metric_value;
      });

      this.setState({
        globalMetrics: {
          totalMealsMoved: metrics['total_meals_moved'] || 0,
          activeNodesCount: metrics['active_nodes_count'] || 0,
          activeDepotsCount: metrics['active_depots_count'] || 0,
          totalCreditsEarned: metrics['total_credits_earned'] || 0,
        },
      });
    }
  }

  async fetchActiveDepots(): Promise<Depot[]> {
    const { data } = await supabase
      .from('nmh_depots')
      .select('*')
      .eq('is_active', true);

    if (data) {
      const depots: Depot[] = data.map((d) => ({
        id: d.id,
        tier: d.tier as DepotTier,
        hostUserId: d.host_user_id,
        name: d.name,
        location: { latitude: d.location_lat, longitude: d.location_lng },
        capacity: d.capacity,
        currentStock: d.current_stock,
        isActive: d.is_active,
      }));
      this.setState({ activeDepots: depots });
      return depots;
    }
    return [];
  }

  // ============================================================================
  // NODE OPERATIONS
  // ============================================================================

  async toggleNode(on: boolean): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newStatus: NodeStatus = on ? 'active' : 'dormant';

    // Upsert node record
    await supabase
      .from('nmh_compute_nodes')
      .upsert({
        user_id: user.id,
        status: newStatus,
        last_active_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    this.setState({ nodeStatus: newStatus });

    // Simulate becoming 'contributing' after activation
    if (on) {
      setTimeout(() => {
        this.setState({ nodeStatus: 'contributing' });
        supabase
          .from('nmh_compute_nodes')
          .update({ status: 'contributing' })
          .eq('user_id', user.id);
      }, 1000);
    }
  }

  getNodeMetrics() {
    return {
      cpuUsagePercent: this.state.nodeStatus === 'contributing' ? 5 : 0,
      batteryUsedPercent: this.state.nodeStatus === 'contributing' ? 2 : 0,
      dataTransferredMb: 0,
      creditsEarned: this.state.wallet?.balance || 0,
      uptimeMinutes: 0,
    };
  }

  // ============================================================================
  // WALLET OPERATIONS
  // ============================================================================

  async initializeWallet(userId: string): Promise<CreditWallet | null> {
    // Create participant first (triggers wallet creation)
    await supabase
      .from('nmh_participants')
      .upsert({ user_id: userId }, { onConflict: 'user_id' });

    // Fetch wallet
    const { data } = await supabase
      .from('nmh_credit_wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      const wallet: CreditWallet = {
        id: data.id,
        userId: data.user_id,
        totalEarned: data.total_earned,
        totalRedeemed: data.total_redeemed,
        balance: data.balance,
      };
      this.setState({ wallet });
      return wallet;
    }
    return null;
  }

  async earnCredits(actionType: CreditActionType, multiplier: number = 1): Promise<Credit | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !this.state.wallet) return null;

    const amount = CREDIT_RATES[actionType] * multiplier;

    const { data, error } = await supabase
      .from('nmh_credits')
      .insert({
        wallet_id: this.state.wallet.id,
        user_id: user.id,
        amount,
        action_type: actionType,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to earn credits:', error);
      return null;
    }

    // Refresh wallet
    await this.initializeWallet(user.id);

    return {
      id: data.id,
      walletId: data.wallet_id,
      userId: data.user_id,
      amount: data.amount,
      actionType: data.action_type as CreditActionType,
      earnedAt: new Date(data.earned_at),
      redeemed: data.redeemed,
    };
  }

  getWalletStats() {
    if (!this.state.wallet) return null;
    return {
      totalEarned: this.state.wallet.totalEarned,
      totalRedeemed: this.state.wallet.totalRedeemed,
      balance: this.state.wallet.balance,
    };
  }

  // ============================================================================
  // HUNGER ASSESSMENT
  // ============================================================================

  async submitHungerAssessment(assessment: HungerAssessment): Promise<{ success: boolean; message: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Please sign in to request food.' };

    // Calculate priority score
    const needScore = this.calculateNeedScore(assessment);
    const priorityScore = needScore * 0.7 + 0.3; // 70% need, 30% proximity (simplified)

    const { error } = await supabase
      .from('nmh_hunger_assessments')
      .insert({
        user_id: user.id,
        hunger_level: assessment.hungerLevel,
        last_meal_time: assessment.lastMealTime,
        household_type: assessment.householdType,
        location_lat: assessment.location.latitude,
        location_lng: assessment.location.longitude,
        priority_score: priorityScore,
        need_weight: needScore * 0.7,
        proximity_weight: 0.3,
      });

    if (error) {
      return { success: false, message: 'Something went wrong. Please try again.' };
    }

    return {
      success: true,
      message: "Your request has been received. We're finding food near you. Trust the process.",
    };
  }

  private calculateNeedScore(assessment: HungerAssessment): number {
    const hungerScores: Record<HungerLevel, number> = {
      okay: 0.1,
      getting_hungry: 0.4,
      very_hungry: 0.7,
      havent_eaten: 1.0,
    };

    const mealScores: Record<LastMealTime, number> = {
      today: 0.1,
      yesterday: 0.5,
      two_plus_days: 0.8,
      cant_remember: 1.0,
    };

    const householdScores: Record<HouseholdType, number> = {
      just_me: 0.2,
      kids_at_home: 0.9,
      elderly_dependent: 0.8,
      multiple_mouths: 0.7,
    };

    const hungerWeight = 0.4;
    const mealWeight = 0.35;
    const householdWeight = 0.25;

    return (
      hungerScores[assessment.hungerLevel] * hungerWeight +
      mealScores[assessment.lastMealTime] * mealWeight +
      householdScores[assessment.householdType] * householdWeight
    );
  }

  // ============================================================================
  // FOOD SOURCE OPERATIONS
  // ============================================================================

  async mapFoodSource(source: {
    sourceType: FoodSourceType;
    name: string;
    location: GeoLocation;
    verified: boolean;
    address?: string;
  }): Promise<FoodSource | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('nmh_food_sources')
      .insert({
        source_type: source.sourceType,
        name: source.name,
        location_lat: source.location.latitude,
        location_lng: source.location.longitude,
        address: source.address,
        verified: source.verified,
        mapped_by: user.id,
      })
      .select()
      .single();

    if (error || !data) return null;

    // Earn credits for mapping
    if (source.verified) {
      await this.earnCredits('source_mapped');
    }

    return {
      id: data.id,
      sourceType: data.source_type as FoodSourceType,
      name: data.name,
      location: { latitude: data.location_lat, longitude: data.location_lng },
      verified: data.verified,
      mappedBy: data.mapped_by,
      reliability: data.reliability,
    };
  }

  // ============================================================================
  // DEPOT OPERATIONS
  // ============================================================================

  async registerDepot(depot: {
    tier: DepotTier;
    name: string;
    location: GeoLocation;
    capacity: number;
    address?: string;
  }): Promise<Depot | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('nmh_depots')
      .insert({
        tier: depot.tier,
        host_user_id: user.id,
        name: depot.name,
        location_lat: depot.location.latitude,
        location_lng: depot.location.longitude,
        address: depot.address,
        capacity: depot.capacity,
      })
      .select()
      .single();

    if (error || !data) return null;

    await this.fetchActiveDepots();

    return {
      id: data.id,
      tier: data.tier as DepotTier,
      hostUserId: data.host_user_id,
      name: data.name,
      location: { latitude: data.location_lat, longitude: data.location_lng },
      capacity: data.capacity,
      currentStock: data.current_stock,
      isActive: data.is_active,
    };
  }

  // ============================================================================
  // CARRIER OPERATIONS
  // ============================================================================

  async registerAsCarrier(
    location: GeoLocation,
    transportMode: TransportMode
  ): Promise<Carrier | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('nmh_carriers')
      .upsert({
        user_id: user.id,
        status: 'available',
        location_lat: location.latitude,
        location_lng: location.longitude,
        transport_mode: transportMode,
        is_available: true,
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      status: data.status as CarrierStatus,
      location: { latitude: data.location_lat || 0, longitude: data.location_lng || 0 },
      transportMode: data.transport_mode as TransportMode,
      completedDeliveries: data.completed_deliveries,
      rating: data.rating,
    };
  }

  // ============================================================================
  // STATIC CONTENT
  // ============================================================================

  getManifesto(): string {
    return MANIFESTO;
  }

  getProtocol69(): string {
    return PROTOCOL_69;
  }

  getHungerStats(): typeof HUNGER_STATS {
    return HUNGER_STATS;
  }

  getPhases(): typeof PHASES {
    return PHASES;
  }
}

// Export singleton instance
export const noMoreHungerService = NoMoreHungerService.getInstance();
