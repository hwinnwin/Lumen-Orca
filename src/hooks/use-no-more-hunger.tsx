/**
 * useNoMoreHunger Hook
 *
 * React hook for interacting with the NoMoreHunger service.
 * Provides reactive state updates and convenient action methods.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  noMoreHungerService,
  type NoMoreHungerState,
  type HungerAssessment,
  type FoodSourceType,
  type DepotTier,
  type TransportMode,
  type CreditActionType,
  type GeoLocation,
} from '@/lib/no-more-hunger-service';

export function useNoMoreHunger() {
  const [state, setState] = useState<NoMoreHungerState>(
    noMoreHungerService.getState()
  );

  useEffect(() => {
    const unsubscribe = noMoreHungerService.subscribe(setState);
    return unsubscribe;
  }, []);

  // ============================================================================
  // NODE ACTIONS
  // ============================================================================

  const toggleNode = useCallback(async (on: boolean) => {
    await noMoreHungerService.toggleNode(on);
  }, []);

  const getNodeMetrics = useCallback(() => {
    return noMoreHungerService.getNodeMetrics();
  }, []);

  // ============================================================================
  // HUNGER ASSESSMENT ACTIONS
  // ============================================================================

  const submitAssessment = useCallback(
    async (assessment: HungerAssessment) => {
      return noMoreHungerService.submitHungerAssessment(assessment);
    },
    []
  );

  // ============================================================================
  // CREDIT ACTIONS
  // ============================================================================

  const initWallet = useCallback((userId: string) => {
    return noMoreHungerService.initializeWallet(userId);
  }, []);

  const earnCredits = useCallback(
    (actionType: CreditActionType, multiplier?: number) => {
      return noMoreHungerService.earnCredits(actionType, multiplier);
    },
    []
  );

  const getWalletStats = useCallback(() => {
    return noMoreHungerService.getWalletStats();
  }, []);

  // ============================================================================
  // FOOD SOURCE ACTIONS
  // ============================================================================

  const mapSource = useCallback(
    async (source: {
      sourceType: FoodSourceType;
      name: string;
      location: GeoLocation;
      verified: boolean;
      address?: string;
    }) => {
      return noMoreHungerService.mapFoodSource(source);
    },
    []
  );

  // ============================================================================
  // DEPOT ACTIONS
  // ============================================================================

  const registerDepot = useCallback(
    async (depot: {
      tier: DepotTier;
      name: string;
      location: GeoLocation;
      capacity: number;
      address?: string;
    }) => {
      return noMoreHungerService.registerDepot(depot);
    },
    []
  );

  // ============================================================================
  // CARRIER ACTIONS
  // ============================================================================

  const registerAsCarrier = useCallback(
    async (location: GeoLocation, transportMode: TransportMode) => {
      return noMoreHungerService.registerAsCarrier(location, transportMode);
    },
    []
  );

  // ============================================================================
  // STATIC CONTENT
  // ============================================================================

  const getManifesto = useCallback(() => {
    return noMoreHungerService.getManifesto();
  }, []);

  const getProtocol69 = useCallback(() => {
    return noMoreHungerService.getProtocol69();
  }, []);

  const getHungerStats = useCallback(() => {
    return noMoreHungerService.getHungerStats();
  }, []);

  const getPhases = useCallback(() => {
    return noMoreHungerService.getPhases();
  }, []);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const isNodeActive = state.nodeStatus === 'contributing';
  const isNodeOnline = state.nodeStatus !== 'dormant' && state.nodeStatus !== 'offline';
  const walletBalance = state.wallet?.balance ?? 0;
  const queueLength = state.currentQueue.length;

  return {
    // State
    state,
    isNodeActive,
    isNodeOnline,
    walletBalance,
    queueLength,

    // Node actions
    toggleNode,
    getNodeMetrics,

    // Assessment actions
    submitAssessment,

    // Credit actions
    initWallet,
    earnCredits,
    getWalletStats,

    // Network actions
    mapSource,
    registerDepot,
    registerAsCarrier,

    // Content
    getManifesto,
    getProtocol69,
    getHungerStats,
    getPhases,
  };
}
