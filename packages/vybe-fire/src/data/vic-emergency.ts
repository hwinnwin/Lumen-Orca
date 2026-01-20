/**
 * VicEmergency Data Client
 *
 * Fetches fire incident data from Victoria's emergency services.
 * Source: https://data.emergency.vic.gov.au/Show?pageId=getIncidentJSON
 *
 * Design principles:
 * - Fail gracefully (return cached data on error)
 * - Log all failures for debugging
 * - Never throw in production paths
 */

import { FireEdge, Coordinates } from '../types.js';
import {
  VicEmergencyIncident,
  VicEmergencyResponse,
  CachedData,
  DataAggregatorConfig,
  DEFAULT_AGGREGATOR_CONFIG,
} from './types.js';

const VIC_EMERGENCY_URL = 'https://data.emergency.vic.gov.au/Show?pageId=getIncidentJSON';

// Fire-related category keywords
const FIRE_CATEGORIES = [
  'fire',
  'bushfire',
  'grass fire',
  'scrub fire',
  'forest fire',
  'wildfire',
  'burn',
];

/**
 * Check if an incident is fire-related
 */
function isFireIncident(incident: VicEmergencyIncident): boolean {
  const category = `${incident.category1} ${incident.category2}`.toLowerCase();
  return FIRE_CATEGORIES.some((keyword) => category.includes(keyword));
}

/**
 * Transform VicEmergency incident to our FireEdge type
 */
function transformIncident(incident: VicEmergencyIncident): FireEdge | null {
  // Must have location
  if (typeof incident.lat !== 'number' || typeof incident.lon !== 'number') {
    return null;
  }

  // Build geometry from available data
  let geometry: Coordinates[] = [];

  if (incident.geometry?.coordinates) {
    // Parse GeoJSON-style coordinates
    geometry = parseGeometry(incident.geometry);
  }

  // Fallback to single point if no geometry
  if (geometry.length === 0) {
    geometry = [{ latitude: incident.lat, longitude: incident.lon }];
  }

  return {
    geometry,
    incidentId: incident.id,
    timestamp: new Date(incident.updated),
  };
}

/**
 * Parse GeoJSON-style geometry into our Coordinates array
 */
function parseGeometry(geo: { type: string; coordinates: number[][][] | number[][] }): Coordinates[] {
  const coords: Coordinates[] = [];

  try {
    if (geo.type === 'Point' && Array.isArray(geo.coordinates)) {
      // [lon, lat]
      const [lon, lat] = geo.coordinates as number[];
      if (typeof lat === 'number' && typeof lon === 'number') {
        coords.push({ latitude: lat, longitude: lon });
      }
    } else if (geo.type === 'Polygon' && Array.isArray(geo.coordinates)) {
      // [[[lon, lat], [lon, lat], ...]]
      const ring = geo.coordinates[0] as number[][];
      for (const point of ring) {
        if (Array.isArray(point) && point.length >= 2) {
          coords.push({ latitude: point[1], longitude: point[0] });
        }
      }
    } else if (geo.type === 'MultiPolygon' && Array.isArray(geo.coordinates)) {
      // [[[[lon, lat], ...]]]
      for (const polygon of geo.coordinates) {
        const ring = (polygon as number[][][])[0];
        if (Array.isArray(ring)) {
          for (const point of ring) {
            if (Array.isArray(point) && point.length >= 2) {
              coords.push({ latitude: point[1], longitude: point[0] });
            }
          }
        }
      }
    }
  } catch {
    // Geometry parsing failed, return empty
  }

  return coords;
}

export class VicEmergencyClient {
  private config: DataAggregatorConfig;
  private cache: CachedData<FireEdge[]> | null = null;

  constructor(config: Partial<DataAggregatorConfig> = {}) {
    this.config = { ...DEFAULT_AGGREGATOR_CONFIG, ...config };
  }

  /**
   * Fetch current fire incidents from VicEmergency
   *
   * Returns cached data if:
   * - Cache is still valid
   * - Network request fails
   */
  async getFireEdges(): Promise<FireEdge[]> {
    // Check cache first
    if (this.cache && new Date() < this.cache.expiresAt) {
      return this.cache.data;
    }

    // Attempt fetch with retries
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const fireEdges = await this.fetchFromAPI();

        // Update cache
        const now = new Date();
        this.cache = {
          data: fireEdges,
          fetchedAt: now,
          expiresAt: new Date(now.getTime() + this.config.fireCacheTtlSeconds * 1000),
        };

        return fireEdges;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`VicEmergency fetch attempt ${attempt} failed:`, lastError.message);

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retryAttempts) {
          await this.sleep(Math.pow(2, attempt) * 500);
        }
      }
    }

    // All attempts failed - return stale cache if available
    if (this.cache) {
      console.warn('VicEmergency: Returning stale cache after fetch failure');
      return this.cache.data;
    }

    // No cache available - return empty (fail safe)
    console.error('VicEmergency: No data available', lastError);
    return [];
  }

  /**
   * Get the timestamp of cached data (for UI display)
   */
  getCacheTimestamp(): Date | null {
    return this.cache?.fetchedAt ?? null;
  }

  /**
   * Check if we're using stale (expired) cache
   */
  isUsingStaleCache(): boolean {
    if (!this.cache) return false;
    return new Date() > this.cache.expiresAt;
  }

  /**
   * Force refresh from API (ignores cache)
   */
  async forceRefresh(): Promise<FireEdge[]> {
    this.cache = null;
    return this.getFireEdges();
  }

  private async fetchFromAPI(): Promise<FireEdge[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

    try {
      const response = await fetch(VIC_EMERGENCY_URL, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: VicEmergencyResponse = await response.json();

      // Filter to fire incidents only and transform
      const fireEdges: FireEdge[] = [];

      for (const incident of data.incidents || []) {
        if (isFireIncident(incident)) {
          const edge = transformIncident(incident);
          if (edge) {
            fireEdges.push(edge);
          }
        }
      }

      return fireEdges;
    } finally {
      clearTimeout(timeout);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create mock fire edges for testing/development
 * Uses realistic Victorian locations
 */
export function createMockFireEdges(): FireEdge[] {
  const now = new Date();

  return [
    // Yarra Ranges area (east of Melbourne)
    {
      geometry: [
        { latitude: -37.65, longitude: 145.52 },
        { latitude: -37.64, longitude: 145.54 },
        { latitude: -37.66, longitude: 145.55 },
        { latitude: -37.67, longitude: 145.53 },
      ],
      incidentId: 'mock-001',
      timestamp: now,
    },
    // Dandenong Ranges
    {
      geometry: [
        { latitude: -37.85, longitude: 145.35 },
        { latitude: -37.84, longitude: 145.37 },
        { latitude: -37.86, longitude: 145.38 },
      ],
      incidentId: 'mock-002',
      timestamp: now,
    },
  ];
}
