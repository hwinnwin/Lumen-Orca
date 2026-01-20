/**
 * Risk Translation Engine
 *
 * Converts raw fire/wind/location data into human-comprehensible context.
 * All outputs are deterministic and explainable.
 *
 * This engine does NOT:
 * - Predict fire behaviour with certainty
 * - Issue evacuation commands
 * - Provide routing instructions
 */

import {
  Coordinates,
  FireEdge,
  WindData,
  RiskContext,
  RiskLevel,
  WindRelevance,
  TimeWindow,
  EngineConfig,
  DEFAULT_CONFIG,
} from './types.js';

// === Geo Utilities ===

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
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
 * Calculate bearing from point1 to point2
 * Returns degrees (0 = North, 90 = East)
 */
export function calculateBearing(
  from: Coordinates,
  to: Coordinates
): number {
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const x = Math.sin(dLon) * Math.cos(lat2);
  const y =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const bearing = Math.atan2(x, y);
  return (toDegrees(bearing) + 360) % 360;
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Find the closest point on a fire edge to the user
 */
export function findClosestFirePoint(
  userLocation: Coordinates,
  fireEdge: FireEdge
): { point: Coordinates; distance: number } {
  let closestPoint = fireEdge.geometry[0];
  let minDistance = calculateDistance(userLocation, closestPoint);

  for (const point of fireEdge.geometry) {
    const distance = calculateDistance(userLocation, point);
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = point;
    }
  }

  return { point: closestPoint, distance: minDistance };
}

// === Wind Analysis ===

/**
 * Determine if wind is pushing fire toward, away from, or lateral to user
 *
 * Wind direction is where wind comes FROM.
 * If wind comes from fire direction → pushing toward user.
 */
export function analyzeWindRelevance(
  userLocation: Coordinates,
  fireLocation: Coordinates,
  windDirectionDegrees: number
): WindRelevance {
  // Bearing from fire to user
  const fireToUserBearing = calculateBearing(fireLocation, userLocation);

  // Wind pushes IN the opposite direction from where it comes from
  const windPushDirection = (windDirectionDegrees + 180) % 360;

  // Angular difference between wind push and fire-to-user direction
  let angleDiff = Math.abs(windPushDirection - fireToUserBearing);
  if (angleDiff > 180) {
    angleDiff = 360 - angleDiff;
  }

  // Classify based on angle
  if (angleDiff <= 45) {
    return 'toward';
  } else if (angleDiff >= 135) {
    return 'away';
  } else {
    return 'lateral';
  }
}

/**
 * Generate plain language wind description
 */
export function describeWind(relevance: WindRelevance): string {
  switch (relevance) {
    case 'toward':
      return 'Wind pushing fire toward your area';
    case 'lateral':
      return 'Wind moving fire across your area';
    case 'away':
      return 'Wind pushing fire away from your area';
  }
}

// === Time Estimation ===

/**
 * Estimate time relevance window based on distance and wind speed
 *
 * This is NOT a prediction. It's a conservative estimate of when
 * conditions MIGHT become more relevant IF current conditions persist.
 *
 * Always returns a range, never a single value.
 */
export function estimateTimeWindow(
  distanceKm: number,
  windSpeedKmh: number,
  windRelevance: WindRelevance,
  config: EngineConfig = DEFAULT_CONFIG
): TimeWindow {
  // If wind is pushing away, time window is very long (less relevant)
  if (windRelevance === 'away') {
    return { minMinutes: 240, maxMinutes: 480 };
  }

  // Base calculation: time = distance / speed
  // But fires don't travel at wind speed - use conservative fraction
  const effectiveSpeed = windRelevance === 'toward'
    ? windSpeedKmh * 0.1 // Fire spreads at ~10% of wind speed (very rough)
    : windSpeedKmh * 0.05; // Lateral spread is slower

  // Avoid division by zero
  const safeSpeed = Math.max(effectiveSpeed, 0.5);

  const baseMinutes = (distanceKm / safeSpeed) * 60;

  // Apply conservatism factor to create range
  const minMinutes = Math.round(baseMinutes / config.conservatismFactor);
  const maxMinutes = Math.round(baseMinutes * config.conservatismFactor);

  // Clamp to reasonable ranges
  return {
    minMinutes: Math.max(15, Math.min(minMinutes, 360)),
    maxMinutes: Math.max(30, Math.min(maxMinutes, 480)),
  };
}

// === Risk Level ===

/**
 * Determine internal risk level based on distance and wind relevance
 *
 * This is INTERNAL ONLY - never shown directly to users.
 * Used only for UI color/tone and notification thresholds.
 */
export function calculateRiskLevel(
  distanceKm: number,
  windRelevance: WindRelevance,
  timeWindow: TimeWindow
): RiskLevel {
  // If wind is pushing away, risk is generally low
  if (windRelevance === 'away' && distanceKm > 10) {
    return 'low';
  }

  // Close distance + toward wind = high
  if (distanceKm < 10 && windRelevance === 'toward') {
    return 'high';
  }

  // Short time window = higher risk
  if (timeWindow.minMinutes < 60 && windRelevance !== 'away') {
    return 'high';
  }

  // Medium distance or lateral wind
  if (distanceKm < 25 || windRelevance === 'toward') {
    return 'medium';
  }

  return 'low';
}

// === Context Generation ===

/**
 * Generate the single-sentence risk context
 * Must be factual, not directive
 */
export function generateRiskSentence(
  distanceKm: number,
  windRelevance: WindRelevance,
  riskLevel: RiskLevel
): string {
  const distanceDesc = distanceKm < 10 ? 'nearby' : distanceKm < 25 ? 'in your region' : 'distant';

  if (windRelevance === 'away') {
    return `Fire activity ${distanceDesc} is currently moving away from your area.`;
  }

  if (windRelevance === 'lateral') {
    return `Fire activity ${distanceDesc} is moving across the region.`;
  }

  // Toward
  if (riskLevel === 'high') {
    return 'Conditions may become more relevant if the wind holds.';
  }

  return `Fire activity ${distanceDesc} could become more relevant if conditions persist.`;
}

/**
 * Generate advisory text
 * Must be suggestive, NOT directive
 */
export function generateAdvisory(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'high':
      return 'Now is a good time to prepare to leave.';
    case 'medium':
      return 'Consider reviewing your bushfire plan.';
    case 'low':
      return 'Stay aware of changing conditions.';
  }
}

// === Main Engine ===

export class RiskTranslationEngine {
  private config: EngineConfig;

  constructor(config: Partial<EngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Calculate complete risk context from inputs
   *
   * This is the main entry point for the engine.
   */
  calculateContext(
    userLocation: Coordinates,
    fireEdges: FireEdge[],
    wind: WindData
  ): RiskContext | null {
    if (fireEdges.length === 0) {
      return null;
    }

    // Find closest fire edge
    let closestEdge = fireEdges[0];
    let closestResult = findClosestFirePoint(userLocation, closestEdge);

    for (const edge of fireEdges.slice(1)) {
      const result = findClosestFirePoint(userLocation, edge);
      if (result.distance < closestResult.distance) {
        closestEdge = edge;
        closestResult = result;
      }
    }

    const distanceKm = Math.round(closestResult.distance * 10) / 10; // Round to 1 decimal

    // Analyze wind
    const windRelevance = analyzeWindRelevance(
      userLocation,
      closestResult.point,
      wind.directionDegrees
    );
    const windDescription = describeWind(windRelevance);

    // Estimate time window
    const timeWindow = estimateTimeWindow(
      distanceKm,
      wind.speedKmh,
      windRelevance,
      this.config
    );

    // Calculate risk level
    const riskLevel = calculateRiskLevel(distanceKm, windRelevance, timeWindow);

    // Generate human-readable outputs
    const riskSentence = generateRiskSentence(distanceKm, windRelevance, riskLevel);
    const advisory = generateAdvisory(riskLevel);

    return {
      distanceKm,
      windRelevance,
      windDescription,
      timeWindow,
      riskSentence,
      advisory,
      riskLevel,
      calculatedAt: new Date(),
      dataTimestamps: {
        fire: closestEdge.timestamp,
        wind: wind.timestamp,
      },
    };
  }

  /**
   * Check if data is stale
   */
  isDataStale(context: RiskContext): boolean {
    const now = new Date();
    const threshold = this.config.staleDataThresholdMinutes * 60 * 1000;

    const fireAge = now.getTime() - context.dataTimestamps.fire.getTime();
    const windAge = now.getTime() - context.dataTimestamps.wind.getTime();

    return fireAge > threshold || windAge > threshold;
  }

  /**
   * Format time window for display
   */
  formatTimeWindow(window: TimeWindow): string {
    return `${window.minMinutes}–${window.maxMinutes} minutes`;
  }
}
