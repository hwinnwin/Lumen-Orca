/**
 * NoMoreHunger Service
 *
 * Frontend service layer for the NoMoreHunger distributed food network.
 * Integrates with Lumen Orca orchestration and the @lumen/no-more-hunger package.
 *
 * Protocol 69: Never take. Always give back more.
 */

import type {
  ComputeNode,
  NodeStatus,
  HungerAssessment,
  PriorityScore,
  CreditWallet,
  Credit,
  FoodSource,
  Depot,
  Carrier,
  DeliveryRoute,
  Participant,
  ImpactMetrics,
  GeoLocation,
  SystemEvent,
  QueueMessage,
} from '@lumen/no-more-hunger';

import {
  calculatePriorityScore,
  sortByPriority,
  generateQueueMessage,
  createWallet,
  addCreditToWallet,
  createCredit,
  getWalletStats,
  MANIFESTO,
  PROTOCOL_69,
  HUNGER_STATS,
  PHASES,
} from '@lumen/no-more-hunger';

// ============================================================================
// SERVICE STATE
// ============================================================================

interface NoMoreHungerState {
  // User state
  currentUser: Participant | null;
  wallet: CreditWallet | null;

  // Node network
  nodeStatus: NodeStatus;
  activeNodes: number;
  totalComputePower: number;

  // Food network
  availableFoodSources: FoodSource[];
  activeDepots: Depot[];
  activeCarriers: Carrier[];
  pendingDeliveries: DeliveryRoute[];

  // Queue
  currentQueue: Array<{
    assessment: HungerAssessment;
    score: PriorityScore;
  }>;

  // Impact metrics
  globalMetrics: {
    totalMealsMoved: number;
    activeNodesCount: number;
    activeDepotsCount: number;
    totalCreditsEarned: number;
  };

  // System
  isConnected: boolean;
  lastSync: Date | null;
}

type StateListener = (state: NoMoreHungerState) => void;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

class NoMoreHungerService {
  private static instance: NoMoreHungerService;
  private state: NoMoreHungerState;
  private listeners: Set<StateListener> = new Set();

  private constructor() {
    this.state = this.getInitialState();
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
      pendingDeliveries: [],
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

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  getState(): NoMoreHungerState {
    return { ...this.state };
  }

  private setState(updates: Partial<NoMoreHungerState>): void {
    this.state = { ...this.state, ...updates };
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
  // NODE OPERATIONS (FIRE PILLAR)
  // ============================================================================

  /**
   * Toggle the compute node ON/OFF
   * This is the simplest action - full user control
   */
  async toggleNode(on: boolean): Promise<void> {
    if (on) {
      this.setState({ nodeStatus: 'active' });
      // In production: Start contributing compute cycles
      // For now: Simulate activation
      setTimeout(() => {
        this.setState({ nodeStatus: 'contributing' });
      }, 1000);
    } else {
      this.setState({ nodeStatus: 'dormant' });
    }
  }

  /**
   * Get node transparency metrics
   * User can always see exactly what's being used
   */
  getNodeMetrics(): {
    cpuUsagePercent: number;
    batteryUsedPercent: number;
    dataTransferredMb: number;
    creditsEarned: number;
    uptimeMinutes: number;
  } {
    // In production: Real metrics from compute contribution
    return {
      cpuUsagePercent: this.state.nodeStatus === 'contributing' ? 5 : 0,
      batteryUsedPercent: this.state.nodeStatus === 'contributing' ? 2 : 0,
      dataTransferredMb: 0,
      creditsEarned: this.state.wallet?.balance || 0,
      uptimeMinutes: 0,
    };
  }

  // ============================================================================
  // HUNGER ASSESSMENT (PRIORITY ENGINE)
  // ============================================================================

  /**
   * Submit a hunger assessment
   * Trust-based system - we don't verify, we trust
   */
  async submitHungerAssessment(
    assessment: Omit<HungerAssessment, 'assessmentId' | 'timestamp'>
  ): Promise<{ score: PriorityScore; message: QueueMessage }> {
    const fullAssessment: HungerAssessment = {
      ...assessment,
      assessmentId: `assess_${Date.now()}`,
      timestamp: new Date(),
    };

    // Default food source location (would come from Lumen Orca in production)
    const defaultSourceLocation: GeoLocation = {
      latitude: assessment.location.latitude,
      longitude: assessment.location.longitude + 0.01,
    };

    const score = calculatePriorityScore(
      fullAssessment,
      defaultSourceLocation,
      this.state.currentQueue.length + 1
    );

    const message = generateQueueMessage(
      assessment.userId,
      score.queuePosition,
      score.estimatedWaitMinutes,
      score.queuePosition === 1
    );

    // Add to queue
    const newQueue = [...this.state.currentQueue, { assessment: fullAssessment, score }];
    const sorted = sortByPriority(
      newQueue.map((q) => q.assessment),
      defaultSourceLocation
    );

    this.setState({ currentQueue: sorted });

    return { score, message };
  }

  // ============================================================================
  // CREDIT OPERATIONS (DRAGON'S TREASURE)
  // ============================================================================

  /**
   * Initialize wallet for user
   */
  initializeWallet(userId: string): CreditWallet {
    const wallet = createWallet(userId);
    this.setState({ wallet });
    return wallet;
  }

  /**
   * Earn credits for an action
   */
  earnCredits(
    actionType: Credit['actionType'],
    multiplier: number = 1
  ): Credit | null {
    if (!this.state.wallet) return null;

    const credit = createCredit(
      this.state.wallet.userId,
      actionType,
      multiplier
    );

    const updatedWallet = addCreditToWallet(this.state.wallet, credit);
    this.setState({ wallet: updatedWallet });

    return credit;
  }

  /**
   * Get wallet statistics
   */
  getWalletStats() {
    if (!this.state.wallet) return null;
    return getWalletStats(this.state.wallet);
  }

  // ============================================================================
  // FOOD SOURCE OPERATIONS (WATER PILLAR)
  // ============================================================================

  /**
   * Map a new food source
   */
  async mapFoodSource(
    source: Omit<FoodSource, 'sourceId' | 'mappedAt' | 'reliability'>
  ): Promise<FoodSource> {
    const fullSource: FoodSource = {
      ...source,
      sourceId: `src_${Date.now()}`,
      mappedAt: new Date(),
      reliability: 0.5, // Start at neutral, builds over time
    };

    this.setState({
      availableFoodSources: [...this.state.availableFoodSources, fullSource],
    });

    // Earn credits for mapping
    if (source.verified) {
      this.earnCredits('source_mapped');
    }

    return fullSource;
  }

  // ============================================================================
  // DEPOT OPERATIONS (EARTH PILLAR)
  // ============================================================================

  /**
   * Register as a depot host
   */
  async registerDepot(
    depot: Omit<Depot, 'depotId' | 'createdAt' | 'currentStock'>
  ): Promise<Depot> {
    const fullDepot: Depot = {
      ...depot,
      depotId: `depot_${Date.now()}`,
      createdAt: new Date(),
      currentStock: 0,
    };

    this.setState({
      activeDepots: [...this.state.activeDepots, fullDepot],
    });

    return fullDepot;
  }

  // ============================================================================
  // CARRIER OPERATIONS
  // ============================================================================

  /**
   * Register as a carrier
   */
  async registerAsCarrier(
    userId: string,
    location: GeoLocation,
    transportMode: Carrier['transportMode']
  ): Promise<Carrier> {
    const carrier: Carrier = {
      carrierId: `carrier_${Date.now()}`,
      userId,
      status: 'available',
      location,
      transportMode,
      completedDeliveries: 0,
      rating: 5.0, // Start with full trust
    };

    this.setState({
      activeCarriers: [...this.state.activeCarriers, carrier],
    });

    return carrier;
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

  // ============================================================================
  // IMPACT TRACKING
  // ============================================================================

  getGlobalMetrics() {
    return this.state.globalMetrics;
  }

  /**
   * Get user's personal impact
   */
  getUserImpact(): ImpactMetrics | null {
    return this.state.currentUser?.impactMetrics || null;
  }
}

// Export singleton instance
export const noMoreHungerService = NoMoreHungerService.getInstance();

// Export types for components
export type { NoMoreHungerState };
