/**
 * Risk Translation Engine Tests
 *
 * These tests verify the core logic is:
 * - Deterministic (same inputs → same outputs)
 * - Conservative (errs on side of caution)
 * - Explainable (results make intuitive sense)
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDistance,
  calculateBearing,
  findClosestFirePoint,
  analyzeWindRelevance,
  describeWind,
  estimateTimeWindow,
  calculateRiskLevel,
  generateRiskSentence,
  generateAdvisory,
  RiskTranslationEngine,
} from './risk-engine.js';
import { Coordinates, FireEdge, WindData } from './types.js';

// === Test Data ===

// Melbourne CBD
const MELBOURNE: Coordinates = { latitude: -37.8136, longitude: 144.9631 };

// Healesville (NE of Melbourne, in fire-prone area)
const HEALESVILLE: Coordinates = { latitude: -37.6537, longitude: 145.5185 };

// Black Saturday fire approximate start location
const FIRE_LOCATION: Coordinates = { latitude: -37.4, longitude: 145.3 };

function createFireEdge(points: Coordinates[], hoursAgo = 0): FireEdge {
  return {
    geometry: points,
    incidentId: 'test-incident-001',
    timestamp: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
  };
}

function createWind(direction: number, speed: number, hoursAgo = 0): WindData {
  return {
    directionDegrees: direction,
    speedKmh: speed,
    timestamp: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
  };
}

// === Geo Utility Tests ===

describe('calculateDistance', () => {
  it('returns 0 for same point', () => {
    const distance = calculateDistance(MELBOURNE, MELBOURNE);
    expect(distance).toBe(0);
  });

  it('calculates Melbourne to Healesville correctly (~55km)', () => {
    const distance = calculateDistance(MELBOURNE, HEALESVILLE);
    expect(distance).toBeGreaterThan(50);
    expect(distance).toBeLessThan(60);
  });

  it('is symmetric', () => {
    const d1 = calculateDistance(MELBOURNE, HEALESVILLE);
    const d2 = calculateDistance(HEALESVILLE, MELBOURNE);
    expect(d1).toBeCloseTo(d2, 5);
  });
});

describe('calculateBearing', () => {
  it('returns ~0 for due north', () => {
    const south: Coordinates = { latitude: -38, longitude: 145 };
    const north: Coordinates = { latitude: -37, longitude: 145 };
    const bearing = calculateBearing(south, north);
    expect(bearing).toBeLessThan(5);
  });

  it('returns ~90 for due east', () => {
    const west: Coordinates = { latitude: -37, longitude: 144 };
    const east: Coordinates = { latitude: -37, longitude: 145 };
    const bearing = calculateBearing(west, east);
    expect(bearing).toBeGreaterThan(85);
    expect(bearing).toBeLessThan(95);
  });

  it('returns ~180 for due south', () => {
    const north: Coordinates = { latitude: -37, longitude: 145 };
    const south: Coordinates = { latitude: -38, longitude: 145 };
    const bearing = calculateBearing(north, south);
    expect(bearing).toBeGreaterThan(175);
    expect(bearing).toBeLessThan(185);
  });
});

describe('findClosestFirePoint', () => {
  it('finds the closest point in a fire edge', () => {
    const fireEdge = createFireEdge([
      { latitude: -37.5, longitude: 145.0 }, // ~35km from Melbourne
      { latitude: -37.6, longitude: 145.2 }, // ~25km from Melbourne
      { latitude: -37.7, longitude: 145.5 }, // Further
    ]);

    const result = findClosestFirePoint(MELBOURNE, fireEdge);

    // Should find the second point as closest
    expect(result.point.latitude).toBe(-37.6);
    expect(result.distance).toBeLessThan(35);
  });
});

// === Wind Analysis Tests ===

describe('analyzeWindRelevance', () => {
  it('detects wind pushing fire toward user', () => {
    // Fire is north of user, wind coming from north = pushing toward
    const user: Coordinates = { latitude: -38, longitude: 145 };
    const fire: Coordinates = { latitude: -37, longitude: 145 };
    const windFromNorth = 0; // North wind

    const relevance = analyzeWindRelevance(user, fire, windFromNorth);
    expect(relevance).toBe('toward');
  });

  it('detects wind pushing fire away from user', () => {
    // Fire is north of user, wind coming from south = pushing away
    const user: Coordinates = { latitude: -38, longitude: 145 };
    const fire: Coordinates = { latitude: -37, longitude: 145 };
    const windFromSouth = 180; // South wind

    const relevance = analyzeWindRelevance(user, fire, windFromSouth);
    expect(relevance).toBe('away');
  });

  it('detects lateral wind', () => {
    // Fire is north of user, wind coming from east = lateral
    const user: Coordinates = { latitude: -38, longitude: 145 };
    const fire: Coordinates = { latitude: -37, longitude: 145 };
    const windFromEast = 90; // East wind

    const relevance = analyzeWindRelevance(user, fire, windFromEast);
    expect(relevance).toBe('lateral');
  });
});

describe('describeWind', () => {
  it('generates appropriate descriptions', () => {
    expect(describeWind('toward')).toContain('toward your area');
    expect(describeWind('away')).toContain('away from your area');
    expect(describeWind('lateral')).toContain('across');
  });
});

// === Time Estimation Tests ===

describe('estimateTimeWindow', () => {
  it('returns fixed long window when wind is away', () => {
    const awayWindow = estimateTimeWindow(20, 30, 'away');

    // Away wind always returns the maximum safe window
    expect(awayWindow.minMinutes).toBe(240);
    expect(awayWindow.maxMinutes).toBe(480);
  });

  it('returns shorter window for closer fires', () => {
    const closeWindow = estimateTimeWindow(5, 30, 'toward');
    const farWindow = estimateTimeWindow(50, 30, 'toward');

    expect(closeWindow.minMinutes).toBeLessThan(farWindow.minMinutes);
  });

  it('returns shorter window for faster wind', () => {
    const fastWind = estimateTimeWindow(20, 60, 'toward');
    const slowWind = estimateTimeWindow(20, 10, 'toward');

    expect(fastWind.minMinutes).toBeLessThan(slowWind.minMinutes);
  });

  it('always returns a range (min < max)', () => {
    const window = estimateTimeWindow(20, 30, 'toward');
    expect(window.minMinutes).toBeLessThan(window.maxMinutes);
  });
});

// === Risk Level Tests ===

describe('calculateRiskLevel', () => {
  it('returns high for close fire with wind toward', () => {
    const level = calculateRiskLevel(5, 'toward', { minMinutes: 30, maxMinutes: 60 });
    expect(level).toBe('high');
  });

  it('returns low for distant fire with wind away', () => {
    const level = calculateRiskLevel(50, 'away', { minMinutes: 240, maxMinutes: 480 });
    expect(level).toBe('low');
  });

  it('returns medium for moderate conditions', () => {
    const level = calculateRiskLevel(20, 'lateral', { minMinutes: 90, maxMinutes: 180 });
    expect(level).toBe('medium');
  });
});

// === Context Generation Tests ===

describe('generateRiskSentence', () => {
  it('never says "you are safe"', () => {
    const sentences = [
      generateRiskSentence(5, 'toward', 'high'),
      generateRiskSentence(50, 'away', 'low'),
      generateRiskSentence(20, 'lateral', 'medium'),
    ];

    for (const sentence of sentences) {
      expect(sentence.toLowerCase()).not.toContain('safe');
    }
  });

  it('never says "evacuate"', () => {
    const sentence = generateRiskSentence(5, 'toward', 'high');
    expect(sentence.toLowerCase()).not.toContain('evacuate');
  });
});

describe('generateAdvisory', () => {
  it('is suggestive, not directive', () => {
    const advisories = [
      generateAdvisory('high'),
      generateAdvisory('medium'),
      generateAdvisory('low'),
    ];

    for (const advisory of advisories) {
      // Should not contain command words
      expect(advisory.toLowerCase()).not.toContain('must');
      expect(advisory.toLowerCase()).not.toContain('evacuate now');
      expect(advisory.toLowerCase()).not.toContain('leave immediately');
    }
  });

  it('high risk suggests preparation', () => {
    const advisory = generateAdvisory('high');
    expect(advisory.toLowerCase()).toContain('prepare');
  });
});

// === Full Engine Tests ===

describe('RiskTranslationEngine', () => {
  it('calculates complete context from inputs', () => {
    const engine = new RiskTranslationEngine();

    const fireEdges = [
      createFireEdge([FIRE_LOCATION]),
    ];
    const wind = createWind(0, 30); // North wind at 30km/h

    const context = engine.calculateContext(HEALESVILLE, fireEdges, wind);

    expect(context).not.toBeNull();
    expect(context!.distanceKm).toBeGreaterThan(0);
    expect(context!.windDescription).toBeTruthy();
    expect(context!.riskSentence).toBeTruthy();
    expect(context!.advisory).toBeTruthy();
  });

  it('returns null when no fire edges', () => {
    const engine = new RiskTranslationEngine();
    const wind = createWind(0, 30);

    const context = engine.calculateContext(MELBOURNE, [], wind);
    expect(context).toBeNull();
  });

  it('identifies stale data', () => {
    const engine = new RiskTranslationEngine({ staleDataThresholdMinutes: 30 });

    const fireEdges = [createFireEdge([FIRE_LOCATION], 2)]; // 2 hours old
    const wind = createWind(0, 30, 2); // 2 hours old

    const context = engine.calculateContext(HEALESVILLE, fireEdges, wind);

    expect(context).not.toBeNull();
    expect(engine.isDataStale(context!)).toBe(true);
  });

  it('formats time window correctly', () => {
    const engine = new RiskTranslationEngine();
    const formatted = engine.formatTimeWindow({ minMinutes: 60, maxMinutes: 120 });
    expect(formatted).toBe('60–120 minutes');
  });
});

// === Safety Invariants ===

describe('Safety Invariants', () => {
  const engine = new RiskTranslationEngine();

  it('NEVER outputs "you are safe"', () => {
    // Test across various conditions
    const conditions = [
      { distance: 5, wind: 'toward' as const },
      { distance: 100, wind: 'away' as const },
      { distance: 20, wind: 'lateral' as const },
    ];

    for (const { distance, wind } of conditions) {
      const fireEdges = [createFireEdge([
        { latitude: MELBOURNE.latitude + (distance / 111), longitude: MELBOURNE.longitude }
      ])];
      const windData = createWind(wind === 'toward' ? 180 : wind === 'away' ? 0 : 90, 30);

      const context = engine.calculateContext(MELBOURNE, fireEdges, windData);
      if (context) {
        const allText = `${context.riskSentence} ${context.advisory}`.toLowerCase();
        expect(allText).not.toContain('you are safe');
        expect(allText).not.toContain("you're safe");
      }
    }
  });

  it('NEVER outputs evacuation commands', () => {
    const fireEdges = [createFireEdge([
      { latitude: MELBOURNE.latitude + 0.01, longitude: MELBOURNE.longitude } // Very close
    ])];
    const wind = createWind(180, 60); // Strong wind toward

    const context = engine.calculateContext(MELBOURNE, fireEdges, wind);
    if (context) {
      const allText = `${context.riskSentence} ${context.advisory}`.toLowerCase();
      expect(allText).not.toContain('evacuate now');
      expect(allText).not.toContain('leave now');
      expect(allText).not.toContain('you must leave');
    }
  });
});
