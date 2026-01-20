/**
 * Data Aggregator
 *
 * Combines fire and weather data into a unified interface.
 * Handles caching, offline support, and data freshness tracking.
 *
 * Design principles:
 * - Single source of truth for all external data
 * - Graceful degradation when sources unavailable
 * - Clear visibility into data freshness
 */

import { Coordinates, FireEdge, WindData } from '../types.js';
import { RiskTranslationEngine, RiskContext } from '../risk-engine.js';
import { VicEmergencyClient, createMockFireEdges } from './vic-emergency.js';
import { BOMWeatherClient, createMockWindData } from './bom-weather.js';
import { DataAggregatorConfig, DEFAULT_AGGREGATOR_CONFIG } from './types.js';

export interface DataStatus {
  fireData: {
    available: boolean;
    timestamp: Date | null;
    isStale: boolean;
    incidentCount: number;
  };
  weatherData: {
    available: boolean;
    timestamp: Date | null;
    isStale: boolean;
  };
  overallHealth: 'good' | 'degraded' | 'unavailable';
}

export interface AggregatedData {
  fireEdges: FireEdge[];
  wind: WindData;
  status: DataStatus;
}

export class DataAggregator {
  private fireClient: VicEmergencyClient;
  private weatherClient: BOMWeatherClient;
  private riskEngine: RiskTranslationEngine;
  private useMockData: boolean;

  constructor(
    config: Partial<DataAggregatorConfig> = {},
    options: { useMockData?: boolean } = {}
  ) {
    this.fireClient = new VicEmergencyClient(config);
    this.weatherClient = new BOMWeatherClient(config);
    this.riskEngine = new RiskTranslationEngine();
    this.useMockData = options.useMockData ?? false;
  }

  /**
   * Fetch all data for a user location
   */
  async fetchData(userLocation: Coordinates): Promise<AggregatedData> {
    // Fetch fire and weather data in parallel
    const [fireEdges, wind] = await Promise.all([
      this.useMockData
        ? Promise.resolve(createMockFireEdges())
        : this.fireClient.getFireEdges(),
      this.useMockData
        ? Promise.resolve(createMockWindData())
        : this.weatherClient.getWindData(userLocation),
    ]);

    // Build status report
    const status = this.buildStatus(fireEdges, userLocation);

    return { fireEdges, wind, status };
  }

  /**
   * Fetch data and calculate risk context in one call
   */
  async fetchAndAnalyze(userLocation: Coordinates): Promise<{
    context: RiskContext | null;
    data: AggregatedData;
  }> {
    const data = await this.fetchData(userLocation);

    const context = this.riskEngine.calculateContext(
      userLocation,
      data.fireEdges,
      data.wind
    );

    return { context, data };
  }

  /**
   * Get current data status without fetching
   */
  getStatus(userLocation: Coordinates): DataStatus {
    const fireTimestamp = this.fireClient.getCacheTimestamp();
    const weatherTimestamp = this.weatherClient.getCacheTimestamp(userLocation);

    const fireStale = this.fireClient.isUsingStaleCache();
    const weatherStale = this.weatherClient.isUsingStaleCache(userLocation);

    return {
      fireData: {
        available: fireTimestamp !== null,
        timestamp: fireTimestamp,
        isStale: fireStale,
        incidentCount: 0, // Unknown without fetching
      },
      weatherData: {
        available: weatherTimestamp !== null,
        timestamp: weatherTimestamp,
        isStale: weatherStale,
      },
      overallHealth: this.calculateHealth(fireTimestamp !== null, weatherTimestamp !== null, fireStale, weatherStale),
    };
  }

  /**
   * Force refresh all data
   */
  async forceRefresh(userLocation: Coordinates): Promise<AggregatedData> {
    this.weatherClient.clearCache();
    return this.fetchData(userLocation);
  }

  /**
   * Enable/disable mock data mode
   */
  setMockMode(enabled: boolean): void {
    this.useMockData = enabled;
  }

  private buildStatus(fireEdges: FireEdge[], userLocation: Coordinates): DataStatus {
    const fireTimestamp = this.fireClient.getCacheTimestamp();
    const weatherTimestamp = this.weatherClient.getCacheTimestamp(userLocation);

    const fireStale = this.fireClient.isUsingStaleCache();
    const weatherStale = this.weatherClient.isUsingStaleCache(userLocation);

    return {
      fireData: {
        available: fireEdges.length > 0 || fireTimestamp !== null,
        timestamp: fireTimestamp,
        isStale: fireStale,
        incidentCount: fireEdges.length,
      },
      weatherData: {
        available: weatherTimestamp !== null,
        timestamp: weatherTimestamp,
        isStale: weatherStale,
      },
      overallHealth: this.calculateHealth(
        fireEdges.length > 0 || fireTimestamp !== null,
        weatherTimestamp !== null,
        fireStale,
        weatherStale
      ),
    };
  }

  private calculateHealth(
    fireAvailable: boolean,
    weatherAvailable: boolean,
    fireStale: boolean,
    weatherStale: boolean
  ): 'good' | 'degraded' | 'unavailable' {
    if (!fireAvailable && !weatherAvailable) {
      return 'unavailable';
    }

    if (!fireAvailable || !weatherAvailable || fireStale || weatherStale) {
      return 'degraded';
    }

    return 'good';
  }
}

/**
 * Singleton instance for app-wide use
 */
let defaultAggregator: DataAggregator | null = null;

export function getDataAggregator(
  config?: Partial<DataAggregatorConfig>,
  options?: { useMockData?: boolean }
): DataAggregator {
  if (!defaultAggregator) {
    defaultAggregator = new DataAggregator(config, options);
  }
  return defaultAggregator;
}

/**
 * Reset the singleton (for testing)
 */
export function resetDataAggregator(): void {
  defaultAggregator = null;
}
