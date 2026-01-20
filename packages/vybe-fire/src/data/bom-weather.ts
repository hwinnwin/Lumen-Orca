/**
 * Bureau of Meteorology Weather Client
 *
 * Fetches wind and weather observations from BOM.
 * Source: https://api.weather.bom.gov.au/v1/locations/{geohash}/observations
 *
 * Note: BOM API has usage restrictions. For production use,
 * consider registering with BOM or using a licensed provider.
 *
 * Design principles:
 * - Fail gracefully (return cached data on error)
 * - Conservative defaults when data unavailable
 * - Never throw in production paths
 */

import { WindData, Coordinates } from '../types.js';
import {
  BOMObservationResponse,
  BOMLocationResponse,
  DIRECTION_TO_DEGREES,
  CachedData,
  DataAggregatorConfig,
  DEFAULT_AGGREGATOR_CONFIG,
} from './types.js';

const BOM_API_BASE = 'https://api.weather.bom.gov.au/v1';

// Geohash precision for ~5km accuracy
const GEOHASH_PRECISION = 6;

// Base32 characters used in geohash
const GEOHASH_CHARS = '0123456789bcdefghjkmnpqrstuvwxyz';

/**
 * Encode coordinates to geohash
 * Based on standard geohash algorithm
 */
export function encodeGeohash(lat: number, lon: number, precision: number = GEOHASH_PRECISION): string {
  let latMin = -90, latMax = 90;
  let lonMin = -180, lonMax = 180;
  let hash = '';
  let bit = 0;
  let ch = 0;
  let isLon = true;

  while (hash.length < precision) {
    if (isLon) {
      const mid = (lonMin + lonMax) / 2;
      if (lon >= mid) {
        ch |= 1 << (4 - bit);
        lonMin = mid;
      } else {
        lonMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) {
        ch |= 1 << (4 - bit);
        latMin = mid;
      } else {
        latMax = mid;
      }
    }

    isLon = !isLon;
    bit++;

    if (bit === 5) {
      hash += GEOHASH_CHARS[ch];
      bit = 0;
      ch = 0;
    }
  }

  return hash;
}

/**
 * Parse wind direction string to degrees
 */
export function parseWindDirection(direction: string): number {
  const normalized = direction.toUpperCase().trim();
  return DIRECTION_TO_DEGREES[normalized] ?? 0;
}

export class BOMWeatherClient {
  private config: DataAggregatorConfig;
  private cache: Map<string, CachedData<WindData>> = new Map();

  constructor(config: Partial<DataAggregatorConfig> = {}) {
    this.config = { ...DEFAULT_AGGREGATOR_CONFIG, ...config };
  }

  /**
   * Get wind data for a location
   *
   * Returns cached data if:
   * - Cache is still valid
   * - Network request fails
   */
  async getWindData(location: Coordinates): Promise<WindData> {
    const geohash = encodeGeohash(location.latitude, location.longitude);
    const cacheKey = geohash.substring(0, 5); // Use 5-char precision for cache key

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && new Date() < cached.expiresAt) {
      return cached.data;
    }

    // Attempt fetch with retries
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const windData = await this.fetchFromAPI(geohash);

        // Update cache
        const now = new Date();
        this.cache.set(cacheKey, {
          data: windData,
          fetchedAt: now,
          expiresAt: new Date(now.getTime() + this.config.weatherCacheTtlSeconds * 1000),
        });

        return windData;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`BOM Weather fetch attempt ${attempt} failed:`, lastError.message);

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retryAttempts) {
          await this.sleep(Math.pow(2, attempt) * 500);
        }
      }
    }

    // All attempts failed - return stale cache if available
    if (cached) {
      console.warn('BOM Weather: Returning stale cache after fetch failure');
      return cached.data;
    }

    // No cache available - return conservative defaults (fail safe)
    console.error('BOM Weather: No data available, using defaults', lastError);
    return this.getDefaultWindData();
  }

  /**
   * Get cached wind data timestamp for a location
   */
  getCacheTimestamp(location: Coordinates): Date | null {
    const geohash = encodeGeohash(location.latitude, location.longitude);
    const cacheKey = geohash.substring(0, 5);
    return this.cache.get(cacheKey)?.fetchedAt ?? null;
  }

  /**
   * Check if using stale cache for a location
   */
  isUsingStaleCache(location: Coordinates): boolean {
    const geohash = encodeGeohash(location.latitude, location.longitude);
    const cacheKey = geohash.substring(0, 5);
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    return new Date() > cached.expiresAt;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  private async fetchFromAPI(geohash: string): Promise<WindData> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

    try {
      // First, get the proper geohash for this location
      const locationUrl = `${BOM_API_BASE}/locations?search=${geohash}`;
      const locationResponse = await fetch(locationUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!locationResponse.ok) {
        throw new Error(`Location lookup failed: HTTP ${locationResponse.status}`);
      }

      const locationData: BOMLocationResponse = await locationResponse.json();
      const bomGeohash = locationData.data?.[0]?.geohash;

      if (!bomGeohash) {
        throw new Error('No location found for geohash');
      }

      // Now fetch observations
      const obsUrl = `${BOM_API_BASE}/locations/${bomGeohash}/observations`;
      const obsResponse = await fetch(obsUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!obsResponse.ok) {
        throw new Error(`Observations failed: HTTP ${obsResponse.status}`);
      }

      const obsData: BOMObservationResponse = await obsResponse.json();

      return {
        directionDegrees: parseWindDirection(obsData.data.wind.direction),
        speedKmh: obsData.data.wind.speed_kilometre,
        timestamp: new Date(obsData.metadata.observation_time),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Conservative default wind data when API unavailable
   * Assumes worst-case (variable wind, moderate speed)
   */
  private getDefaultWindData(): WindData {
    return {
      directionDegrees: 0, // North (conservative assumption)
      speedKmh: 20, // Moderate speed
      timestamp: new Date(),
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create mock wind data for testing/development
 * Simulates typical Victorian summer conditions
 */
export function createMockWindData(direction: 'N' | 'NW' | 'W' | 'SW' | 'S' = 'NW'): WindData {
  return {
    directionDegrees: DIRECTION_TO_DEGREES[direction],
    speedKmh: 25 + Math.random() * 20, // 25-45 km/h (typical hot day)
    timestamp: new Date(),
  };
}
