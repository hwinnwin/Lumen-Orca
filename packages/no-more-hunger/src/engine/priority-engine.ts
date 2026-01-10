/**
 * NoMoreHunger Priority Engine
 *
 * THE FAIRNESS ALGORITHM
 * "Need vs. Distance"
 *
 * Philosophy:
 * - We don't police. We don't interrogate. We don't means-test.
 * - We ASK: "How hungry are you?" We TRUST the answer.
 * - If someone lies to get food faster? They needed it enough to lie.
 *   That's information too. We still fed a hungry person. We still won.
 *
 * Protocol 69: Never take. Always give back more.
 */

import type {
  HungerAssessment,
  HungerLevel,
  LastMealTime,
  HouseholdType,
  PriorityScore,
  GeoLocation,
  QueueMessage,
} from '../types';

// ============================================================================
// WEIGHT CONFIGURATIONS
// ============================================================================

const NEED_WEIGHT = 0.7;       // 70% of total score
const PROXIMITY_WEIGHT = 0.3;  // 30% of total score

// Hunger level scores (self-reported, honor system)
const HUNGER_LEVEL_SCORES: Record<HungerLevel, number> = {
  okay: 0.1,
  getting_hungry: 0.4,
  very_hungry: 0.7,
  havent_eaten: 1.0,
};

// Last meal time scores
const LAST_MEAL_SCORES: Record<LastMealTime, number> = {
  today: 0.1,
  yesterday: 0.5,
  two_plus_days: 0.8,
  cant_remember: 1.0,
};

// Household type multipliers
const HOUSEHOLD_MULTIPLIERS: Record<HouseholdType, number> = {
  just_me: 1.0,
  kids_at_home: 1.5,        // Kids need stability
  elderly_dependent: 1.3,   // Elderly need care
  multiple_mouths: 1.4,     // More people = more need
};

// ============================================================================
// DISTANCE CALCULATIONS
// ============================================================================

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  point1: GeoLocation,
  point2: GeoLocation
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) *
      Math.cos(toRadians(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert distance to a 0-1 proximity score
 * Closer = higher score
 * Max practical delivery distance: 10km
 */
export function distanceToProximityScore(distanceKm: number): number {
  const maxDistance = 10; // km
  if (distanceKm >= maxDistance) return 0;
  return 1 - distanceKm / maxDistance;
}

// ============================================================================
// NEED CALCULATION
// ============================================================================

/**
 * Calculate the need score from a hunger assessment
 * Returns a value from 0-1
 */
export function calculateNeedScore(assessment: HungerAssessment): number {
  const hungerScore = HUNGER_LEVEL_SCORES[assessment.hungerLevel];
  const lastMealScore = LAST_MEAL_SCORES[assessment.lastMealTime];
  const householdMultiplier = HOUSEHOLD_MULTIPLIERS[assessment.householdType];

  // Base need is average of hunger and last meal scores
  const baseNeed = (hungerScore + lastMealScore) / 2;

  // Apply household multiplier, cap at 1.0
  const adjustedNeed = Math.min(baseNeed * householdMultiplier, 1.0);

  return adjustedNeed;
}

// ============================================================================
// PRIORITY SCORING
// ============================================================================

/**
 * Calculate the full priority score for a hunger assessment
 * Higher score = higher priority in the queue
 */
export function calculatePriorityScore(
  assessment: HungerAssessment,
  foodSourceLocation: GeoLocation,
  queuePosition: number = 1
): PriorityScore {
  // Calculate need component (70%)
  const needScore = calculateNeedScore(assessment);
  const needWeight = needScore * NEED_WEIGHT;

  // Calculate proximity component (30%)
  const distance = calculateDistance(assessment.location, foodSourceLocation);
  const proximityScore = distanceToProximityScore(distance);
  const proximityWeight = proximityScore * PROXIMITY_WEIGHT;

  // Total priority
  const total = needWeight + proximityWeight;

  // Estimate wait time (rough calculation, will be refined by Lumen Orca)
  const estimatedWaitMinutes = estimateWaitTime(queuePosition, distance);

  return {
    total,
    needWeight,
    proximityWeight,
    queuePosition,
    estimatedWaitMinutes,
  };
}

/**
 * Estimate wait time based on queue position and distance
 */
function estimateWaitTime(queuePosition: number, distanceKm: number): number {
  // Base time per position in queue: 10 minutes
  const queueTime = (queuePosition - 1) * 10;

  // Travel time estimate: ~10 min per km (accounting for walking + logistics)
  const travelTime = distanceKm * 10;

  return Math.round(queueTime + travelTime);
}

// ============================================================================
// QUEUE MANAGEMENT
// ============================================================================

/**
 * Sort assessments by priority (highest first)
 */
export function sortByPriority(
  assessments: HungerAssessment[],
  foodSourceLocation: GeoLocation
): Array<{ assessment: HungerAssessment; score: PriorityScore }> {
  const scored = assessments.map((assessment, index) => ({
    assessment,
    score: calculatePriorityScore(assessment, foodSourceLocation, index + 1),
  }));

  // Sort by total score descending (highest priority first)
  scored.sort((a, b) => b.score.total - a.score.total);

  // Update queue positions after sorting
  scored.forEach((item, index) => {
    item.score.queuePosition = index + 1;
    item.score.estimatedWaitMinutes = estimateWaitTime(
      index + 1,
      calculateDistance(item.assessment.location, foodSourceLocation)
    );
  });

  return scored;
}

/**
 * Generate a gentle, human queue message
 * We don't say "Request denied". We say "Someone nearby needs this one urgently."
 */
export function generateQueueMessage(
  userId: string,
  queuePosition: number,
  waitMinutes: number,
  isNextUp: boolean
): QueueMessage {
  let message: string;

  if (isNextUp) {
    message = "You're next! Getting your meal ready now.";
  } else if (queuePosition <= 3) {
    message = `You're #${queuePosition} in line. About ${waitMinutes} minutes - we'll ping you when ready!`;
  } else if (queuePosition <= 10) {
    message = `Someone nearby needs this one more urgently right now. You're #${queuePosition} - about ${waitMinutes} min. That work for you?`;
  } else {
    message = `High demand in your area right now. You're #${queuePosition} (${waitMinutes} min est). We're working to bring more food your way.`;
  }

  return {
    recipientId: userId,
    position: queuePosition,
    waitMinutes,
    message,
  };
}

// ============================================================================
// OVERFLOW HANDLING
// ============================================================================

/**
 * Handle situation when demand exceeds supply
 * Returns actions to take
 */
export interface OverflowAction {
  type: 'notify_mappers' | 'request_sources' | 'expand_radius';
  area: GeoLocation;
  radius: number;
  message: string;
}

export function handleOverflow(
  waitingCount: number,
  availableFood: number,
  centerLocation: GeoLocation
): OverflowAction[] {
  const actions: OverflowAction[] = [];

  if (waitingCount > availableFood * 2) {
    // Critical shortage - expand search and notify mappers
    actions.push({
      type: 'notify_mappers',
      area: centerLocation,
      radius: 5, // km
      message: 'High demand detected. Need more food sources mapped in this area.',
    });

    actions.push({
      type: 'request_sources',
      area: centerLocation,
      radius: 10, // km
      message: 'Requesting surplus check from restaurants and groceries nearby.',
    });
  }

  if (waitingCount > availableFood * 5) {
    // Extreme shortage - expand radius significantly
    actions.push({
      type: 'expand_radius',
      area: centerLocation,
      radius: 20, // km
      message: 'Expanding search radius to find more food sources.',
    });
  }

  return actions;
}

// ============================================================================
// TRUST-BASED INSIGHTS
// ============================================================================

/**
 * Over time, the system notices patterns - but NEVER punishes.
 * This is for system optimization, not gatekeeping.
 */
export interface AreaInsight {
  location: GeoLocation;
  radius: number;
  averageDemand: number;
  peakHours: string[];     // Times of high demand
  underserved: boolean;    // Area needs more attention
}

export function analyzeAreaDemand(
  assessments: HungerAssessment[],
  centerLocation: GeoLocation,
  radiusKm: number = 5
): AreaInsight {
  // Filter assessments within radius
  const localAssessments = assessments.filter(
    (a) => calculateDistance(a.location, centerLocation) <= radiusKm
  );

  // Calculate average need score
  const avgNeed =
    localAssessments.reduce((sum, a) => sum + calculateNeedScore(a), 0) /
    (localAssessments.length || 1);

  // Find peak hours (hours with most requests)
  const hourCounts: Record<number, number> = {};
  localAssessments.forEach((a) => {
    const hour = a.timestamp.getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const sortedHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => `${hour}:00`);

  return {
    location: centerLocation,
    radius: radiusKm,
    averageDemand: avgNeed,
    peakHours: sortedHours,
    underserved: avgNeed > 0.7, // High average need = underserved
  };
}
