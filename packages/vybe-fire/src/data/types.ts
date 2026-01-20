/**
 * Data Aggregation Layer Types
 *
 * Raw API response types and transformation utilities.
 */

// === VicEmergency API Types ===
// Source: https://data.emergency.vic.gov.au/Show?pageId=getIncidentJSON

export interface VicEmergencyIncident {
  /** Unique incident ID */
  id: string;
  /** Incident type (e.g., "fire", "bushfire", "grass fire") */
  category1: string;
  category2: string;
  /** Incident status */
  status: string;
  /** Location name */
  location: string;
  /** Latitude */
  lat: number;
  /** Longitude */
  lon: number;
  /** Fire origin point (if available) */
  originPoint?: {
    lat: number;
    lon: number;
  };
  /** Fire perimeter geometry (GeoJSON-like) */
  geometry?: {
    type: string;
    coordinates: number[][][] | number[][];
  };
  /** Size in hectares */
  size?: number;
  /** Last updated timestamp */
  updated: string;
  /** Source agency */
  sourceOrg: string;
  /** Alert level (if applicable) */
  alertLevel?: string;
}

export interface VicEmergencyResponse {
  incidents: VicEmergencyIncident[];
  generatedAt: string;
}

// === BOM Weather API Types ===
// Source: https://api.weather.bom.gov.au/v1/locations/{geohash}/observations

export interface BOMObservation {
  temp: number;
  temp_feels_like: number;
  wind: {
    speed_kilometre: number;
    speed_knot: number;
    direction: string; // "N", "NE", "E", etc.
  };
  gust: {
    speed_kilometre: number;
    speed_knot: number;
  };
  rain_since_9am: number;
  humidity: number;
  station: {
    name: string;
    distance: number;
  };
}

export interface BOMObservationResponse {
  data: BOMObservation;
  metadata: {
    issue_time: string;
    observation_time: string;
    response_timestamp: string;
  };
}

export interface BOMLocationResponse {
  data: {
    geohash: string;
    name: string;
    state: string;
  }[];
  metadata: {
    response_timestamp: string;
  };
}

// === Geohash Utilities ===

/**
 * Direction string to degrees mapping
 */
export const DIRECTION_TO_DEGREES: Record<string, number> = {
  N: 0,
  NNE: 22.5,
  NE: 45,
  ENE: 67.5,
  E: 90,
  ESE: 112.5,
  SE: 135,
  SSE: 157.5,
  S: 180,
  SSW: 202.5,
  SW: 225,
  WSW: 247.5,
  W: 270,
  WNW: 292.5,
  NW: 315,
  NNW: 337.5,
};

// === Cache Types ===

export interface CachedData<T> {
  data: T;
  fetchedAt: Date;
  expiresAt: Date;
}

export interface DataAggregatorConfig {
  /** Cache TTL for fire data in seconds (default: 60) */
  fireCacheTtlSeconds: number;
  /** Cache TTL for weather data in seconds (default: 300) */
  weatherCacheTtlSeconds: number;
  /** Request timeout in milliseconds (default: 10000) */
  requestTimeoutMs: number;
  /** Retry attempts on failure (default: 3) */
  retryAttempts: number;
}

export const DEFAULT_AGGREGATOR_CONFIG: DataAggregatorConfig = {
  fireCacheTtlSeconds: 60,
  weatherCacheTtlSeconds: 300,
  requestTimeoutMs: 10000,
  retryAttempts: 3,
};
