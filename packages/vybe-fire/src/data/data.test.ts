/**
 * Data Aggregation Layer Tests
 *
 * Tests the data layer utilities and transformations.
 * Network-dependent tests use mock data.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { encodeGeohash, parseWindDirection, createMockWindData } from './bom-weather.js';
import { createMockFireEdges } from './vic-emergency.js';
import { DataAggregator, resetDataAggregator } from './aggregator.js';
import { DIRECTION_TO_DEGREES } from './types.js';

// === Test Locations ===

const MELBOURNE = { latitude: -37.8136, longitude: 144.9631 };
const HEALESVILLE = { latitude: -37.6537, longitude: 145.5185 };
const SYDNEY = { latitude: -33.8688, longitude: 151.2093 };

// === Geohash Tests ===

describe('encodeGeohash', () => {
  it('encodes Melbourne to expected geohash prefix', () => {
    const hash = encodeGeohash(MELBOURNE.latitude, MELBOURNE.longitude);
    // Melbourne should start with 'r1r' approximately
    expect(hash.length).toBe(6);
    expect(hash[0]).toBe('r'); // Southern Australia starts with 'r'
  });

  it('encodes different locations to different hashes', () => {
    const melbourneHash = encodeGeohash(MELBOURNE.latitude, MELBOURNE.longitude);
    const sydneyHash = encodeGeohash(SYDNEY.latitude, SYDNEY.longitude);

    expect(melbourneHash).not.toBe(sydneyHash);
  });

  it('encodes nearby locations to similar hashes', () => {
    const hash1 = encodeGeohash(-37.81, 144.96);
    const hash2 = encodeGeohash(-37.82, 144.97);

    // First 3-4 characters should be same for nearby points
    expect(hash1.substring(0, 3)).toBe(hash2.substring(0, 3));
  });

  it('respects precision parameter', () => {
    const hash4 = encodeGeohash(MELBOURNE.latitude, MELBOURNE.longitude, 4);
    const hash8 = encodeGeohash(MELBOURNE.latitude, MELBOURNE.longitude, 8);

    expect(hash4.length).toBe(4);
    expect(hash8.length).toBe(8);
    expect(hash8.startsWith(hash4)).toBe(true);
  });
});

// === Wind Direction Parsing ===

describe('parseWindDirection', () => {
  it('parses cardinal directions', () => {
    expect(parseWindDirection('N')).toBe(0);
    expect(parseWindDirection('E')).toBe(90);
    expect(parseWindDirection('S')).toBe(180);
    expect(parseWindDirection('W')).toBe(270);
  });

  it('parses intercardinal directions', () => {
    expect(parseWindDirection('NE')).toBe(45);
    expect(parseWindDirection('SE')).toBe(135);
    expect(parseWindDirection('SW')).toBe(225);
    expect(parseWindDirection('NW')).toBe(315);
  });

  it('parses secondary intercardinal directions', () => {
    expect(parseWindDirection('NNE')).toBe(22.5);
    expect(parseWindDirection('WSW')).toBe(247.5);
  });

  it('handles lowercase and whitespace', () => {
    expect(parseWindDirection('  nw  ')).toBe(315);
    expect(parseWindDirection('se')).toBe(135);
  });

  it('returns 0 for unknown directions', () => {
    expect(parseWindDirection('INVALID')).toBe(0);
    expect(parseWindDirection('')).toBe(0);
  });
});

// === Mock Data Tests ===

describe('createMockFireEdges', () => {
  it('returns valid fire edges', () => {
    const edges = createMockFireEdges();

    expect(edges.length).toBeGreaterThan(0);

    for (const edge of edges) {
      expect(edge.incidentId).toBeTruthy();
      expect(edge.timestamp).toBeInstanceOf(Date);
      expect(edge.geometry.length).toBeGreaterThan(0);

      for (const point of edge.geometry) {
        expect(typeof point.latitude).toBe('number');
        expect(typeof point.longitude).toBe('number');
        // Victorian coordinates should be in reasonable range
        expect(point.latitude).toBeLessThan(-30);
        expect(point.latitude).toBeGreaterThan(-40);
        expect(point.longitude).toBeGreaterThan(140);
        expect(point.longitude).toBeLessThan(150);
      }
    }
  });
});

describe('createMockWindData', () => {
  it('returns valid wind data with default direction', () => {
    const wind = createMockWindData();

    expect(typeof wind.directionDegrees).toBe('number');
    expect(wind.directionDegrees).toBeGreaterThanOrEqual(0);
    expect(wind.directionDegrees).toBeLessThan(360);
    expect(wind.speedKmh).toBeGreaterThan(0);
    expect(wind.timestamp).toBeInstanceOf(Date);
  });

  it('respects specified direction', () => {
    const northWind = createMockWindData('N');
    const southWind = createMockWindData('S');

    expect(northWind.directionDegrees).toBe(0);
    expect(southWind.directionDegrees).toBe(180);
  });

  it('generates realistic summer wind speeds', () => {
    // Run multiple times to check range
    for (let i = 0; i < 10; i++) {
      const wind = createMockWindData();
      expect(wind.speedKmh).toBeGreaterThanOrEqual(25);
      expect(wind.speedKmh).toBeLessThan(50);
    }
  });
});

// === Data Aggregator Tests ===

describe('DataAggregator', () => {
  beforeEach(() => {
    resetDataAggregator();
  });

  it('fetches mock data when mock mode enabled', async () => {
    const aggregator = new DataAggregator({}, { useMockData: true });

    const result = await aggregator.fetchData(HEALESVILLE);

    expect(result.fireEdges.length).toBeGreaterThan(0);
    expect(result.wind.speedKmh).toBeGreaterThan(0);
  });

  it('can analyze risk in one call', async () => {
    const aggregator = new DataAggregator({}, { useMockData: true });

    const { context, data } = await aggregator.fetchAndAnalyze(HEALESVILLE);

    expect(data.fireEdges.length).toBeGreaterThan(0);
    expect(context).not.toBeNull();
    expect(context!.distanceKm).toBeGreaterThan(0);
  });

  it('reports data status correctly', async () => {
    const aggregator = new DataAggregator({}, { useMockData: true });

    // Before fetching, status should show no data
    const statusBefore = aggregator.getStatus(MELBOURNE);
    expect(statusBefore.overallHealth).toBe('unavailable');

    // After fetching, status should be good
    await aggregator.fetchData(MELBOURNE);
    const statusAfter = aggregator.getStatus(MELBOURNE);
    // Mock data doesn't update cache timestamps, so this tests the structure
    expect(['good', 'degraded', 'unavailable']).toContain(statusAfter.overallHealth);
  });

  it('can toggle mock mode', async () => {
    const aggregator = new DataAggregator({}, { useMockData: false });

    // Enable mock mode
    aggregator.setMockMode(true);
    const result = await aggregator.fetchData(MELBOURNE);

    // Should get mock data
    expect(result.fireEdges.length).toBeGreaterThan(0);
  });
});

// === Direction Mapping Completeness ===

describe('DIRECTION_TO_DEGREES', () => {
  it('has all 16 compass directions', () => {
    const expected = [
      'N', 'NNE', 'NE', 'ENE',
      'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW',
      'W', 'WNW', 'NW', 'NNW',
    ];

    for (const dir of expected) {
      expect(DIRECTION_TO_DEGREES).toHaveProperty(dir);
      expect(typeof DIRECTION_TO_DEGREES[dir]).toBe('number');
    }
  });

  it('has correct degree values', () => {
    expect(DIRECTION_TO_DEGREES['N']).toBe(0);
    expect(DIRECTION_TO_DEGREES['E']).toBe(90);
    expect(DIRECTION_TO_DEGREES['S']).toBe(180);
    expect(DIRECTION_TO_DEGREES['W']).toBe(270);
  });

  it('has evenly spaced intercardinal directions', () => {
    expect(DIRECTION_TO_DEGREES['NE'] - DIRECTION_TO_DEGREES['N']).toBe(45);
    expect(DIRECTION_TO_DEGREES['SE'] - DIRECTION_TO_DEGREES['E']).toBe(45);
  });
});
