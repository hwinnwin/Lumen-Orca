/**
 * Vybe Fire Core Types
 *
 * Design principles:
 * - Fail safe > feature rich
 * - Explainable logic > opaque AI
 * - Conservative outputs > precision theatre
 */

// === Geographic Types ===

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface FireEdge {
  /** Polygon or line representing fire perimeter */
  geometry: Coordinates[];
  /** Source incident ID */
  incidentId: string;
  /** When this data was captured */
  timestamp: Date;
}

// === Weather Types ===

export interface WindData {
  /** Direction wind is coming FROM in degrees (0 = North, 90 = East) */
  directionDegrees: number;
  /** Speed in km/h */
  speedKmh: number;
  /** When this reading was taken */
  timestamp: Date;
}

// === Risk Translation Types ===

/** Internal risk levels - never shown directly to users */
export type RiskLevel = 'low' | 'medium' | 'high';

/** Wind's relationship to user position */
export type WindRelevance = 'toward' | 'lateral' | 'away';

export interface TimeWindow {
  /** Minimum minutes */
  minMinutes: number;
  /** Maximum minutes */
  maxMinutes: number;
}

export interface RiskContext {
  /** Distance to nearest fire edge in km */
  distanceKm: number;

  /** Is wind pushing fire toward, lateral to, or away from user */
  windRelevance: WindRelevance;

  /** Plain language wind description */
  windDescription: string;

  /** Conservative time range estimate */
  timeWindow: TimeWindow;

  /** Single sentence risk context */
  riskSentence: string;

  /** Suggestive, non-directive advisory */
  advisory: string;

  /** Internal risk level (for UI color/tone only) */
  riskLevel: RiskLevel;

  /** When this context was calculated */
  calculatedAt: Date;

  /** Data freshness info */
  dataTimestamps: {
    fire: Date;
    wind: Date;
  };
}

// === Notification Types ===

export type NotificationTrigger =
  | 'risk_level_increased'
  | 'time_window_shortened'
  | 'wind_shifted_toward';

export interface Notification {
  trigger: NotificationTrigger;
  message: string;
  timestamp: Date;
}

// === Engine Configuration ===

export interface EngineConfig {
  /**
   * Conservative multiplier for time estimates
   * Higher = more conservative (wider windows)
   * Default: 1.5
   */
  conservatismFactor: number;

  /**
   * Maximum data age before considered stale (minutes)
   * Default: 30
   */
  staleDataThresholdMinutes: number;

  /**
   * Minimum distance change to trigger notification (km)
   * Default: 2
   */
  significantDistanceChangeKm: number;
}

export const DEFAULT_CONFIG: EngineConfig = {
  conservatismFactor: 1.5,
  staleDataThresholdMinutes: 30,
  significantDistanceChangeKm: 2,
};
