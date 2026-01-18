/**
 * Compliance Engine Tests
 */

import { describe, it, expect } from 'vitest';
import {
  ComplianceEngine,
  getComplianceEngine,
  COMPLIANCE_PROFILES,
  type ComplianceLevel,
} from '../src/safety/compliance-engine';
import { buildAI, type BuilderInput } from '../src/core/builder-service';
import type { UserId, AIObject } from '../src/core/ai-object';

const testUserId = 'test_user_123' as UserId;

const createTestAI = (overrides?: Partial<BuilderInput>): AIObject => {
  const input: BuilderInput = {
    name: 'Test AI',
    purpose: 'Help with testing compliance features',
    purposeCategory: 'business',
    capabilities: ['Test compliance', 'Validate safety'],
    exclusions: [],
    strictness: 3,
    prohibitions: [],
    emotionalTemperature: 'neutral',
    formality: 'professional',
    verbosity: 'standard',
    contentPolicy: 'standard',
    disallowedTopics: [],
    memoryMode: 'session',
    ...overrides,
  };
  return buildAI(input, testUserId).aiObject;
};

describe('ComplianceEngine', () => {
  describe('checkCompliance()', () => {
    const levels: ComplianceLevel[] = ['app_store', 'enterprise', 'regulated', 'custom'];

    it.each(levels)('should check %s compliance level', (level) => {
      const engine = getComplianceEngine();
      const ai = createTestAI();
      const result = engine.checkCompliance(ai, level);

      expect(result).toBeDefined();
      expect(typeof result.compliant).toBe('boolean');
      expect(Array.isArray(result.violations)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should pass app_store with standard settings', () => {
      const engine = getComplianceEngine();
      const ai = createTestAI({ contentPolicy: 'standard' });
      const result = engine.checkCompliance(ai, 'app_store');

      expect(result.compliant).toBe(true);
    });

    it('should fail app_store with permissive content policy', () => {
      const engine = getComplianceEngine();
      const ai = createTestAI({ contentPolicy: 'permissive' });
      const result = engine.checkCompliance(ai, 'app_store');

      expect(result.compliant).toBe(false);
      expect(result.violations.some(v => v.includes('content policy'))).toBe(true);
    });

    it('should require audit logging for enterprise', () => {
      const engine = getComplianceEngine();
      const ai = createTestAI();
      const result = engine.checkCompliance(ai, 'enterprise');

      // Default AI doesn't have audit logging enabled in compliance
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('getComplianceLevel()', () => {
    it('should return highest compliant level', () => {
      const engine = getComplianceEngine();
      const ai = createTestAI({ contentPolicy: 'strict' });
      const level = engine.getComplianceLevel(ai);

      expect(level).toBeDefined();
    });

    it('should return null for non-compliant AI', () => {
      const engine = getComplianceEngine();
      // Create an AI that won't pass any compliance level
      const input: BuilderInput = {
        name: 'Test',
        purpose: 'Testing non-compliance',
        purposeCategory: 'custom',
        capabilities: [],
        exclusions: [],
        strictness: 1,
        prohibitions: [],
        emotionalTemperature: 'neutral',
        formality: 'casual',
        verbosity: 'standard',
        contentPolicy: 'permissive',
        disallowedTopics: [],
        memoryMode: 'stateless',
      };
      const ai = buildAI(input, testUserId).aiObject;

      // Manually disable safety features to make it non-compliant
      ai.safety.hardStops = ai.safety.hardStops.map(hs => ({ ...hs, enabled: false }));
      ai.safety.aiFraming.alwaysIdentifyAsAI = false;

      const level = engine.getComplianceLevel(ai);
      expect(level).toBeNull();
    });
  });

  describe('generateReport()', () => {
    it('should generate comprehensive report', () => {
      const engine = getComplianceEngine();
      const ai = createTestAI();
      const report = engine.generateReport(ai);

      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.aiObjectId).toBe(ai.id);
      expect(report.aiObjectName).toBe(ai.name);
      expect(report.levelResults).toBeDefined();
      expect(report.levelResults.app_store).toBeDefined();
      expect(report.levelResults.enterprise).toBeDefined();
      expect(report.levelResults.regulated).toBeDefined();
      expect(report.levelResults.custom).toBeDefined();
      expect(typeof report.summary).toBe('string');
    });

    it('should include results for all levels', () => {
      const engine = getComplianceEngine();
      const ai = createTestAI();
      const report = engine.generateReport(ai);

      const levels: ComplianceLevel[] = ['app_store', 'enterprise', 'regulated', 'custom'];
      levels.forEach(level => {
        expect(report.levelResults[level]).toBeDefined();
        expect(typeof report.levelResults[level].compliant).toBe('boolean');
      });
    });
  });

  describe('enforceCompliance()', () => {
    it('should modify AI to meet app_store compliance', () => {
      const engine = getComplianceEngine();
      const ai = createTestAI({ contentPolicy: 'permissive' });

      // Initially non-compliant
      expect(engine.checkCompliance(ai, 'app_store').compliant).toBe(false);

      // Enforce compliance
      const modified = engine.enforceCompliance(ai, 'app_store');

      // Now compliant
      expect(engine.checkCompliance(modified, 'app_store').compliant).toBe(true);
    });

    it('should enable all safety hard stops', () => {
      const engine = getComplianceEngine();
      const ai = createTestAI();
      ai.safety.hardStops = ai.safety.hardStops.map(hs => ({ ...hs, enabled: false }));

      const modified = engine.enforceCompliance(ai, 'app_store');

      modified.safety.hardStops.forEach(hs => {
        expect(hs.enabled).toBe(true);
      });
    });

    it('should enable AI framing', () => {
      const engine = getComplianceEngine();
      const ai = createTestAI();
      ai.safety.aiFraming.alwaysIdentifyAsAI = false;

      const modified = engine.enforceCompliance(ai, 'app_store');

      expect(modified.safety.aiFraming.alwaysIdentifyAsAI).toBe(true);
    });

    it('should upgrade content policy for app_store', () => {
      const engine = getComplianceEngine();
      const ai = createTestAI({ contentPolicy: 'permissive' });

      const modified = engine.enforceCompliance(ai, 'app_store');

      expect(['standard', 'strict']).toContain(modified.safety.contentPolicy);
    });

    it('should enable dependency prevention', () => {
      const engine = getComplianceEngine();
      const ai = createTestAI();
      ai.safety.dependencyPrevention.enabled = false;

      const modified = engine.enforceCompliance(ai, 'app_store');

      expect(modified.safety.dependencyPrevention.enabled).toBe(true);
    });
  });
});

describe('Compliance Profiles', () => {
  it('should have all required profiles', () => {
    expect(COMPLIANCE_PROFILES.app_store).toBeDefined();
    expect(COMPLIANCE_PROFILES.enterprise).toBeDefined();
    expect(COMPLIANCE_PROFILES.regulated).toBeDefined();
    expect(COMPLIANCE_PROFILES.custom).toBeDefined();
  });

  it('app_store profile should require strict content policy', () => {
    const profile = COMPLIANCE_PROFILES.app_store;
    expect(profile.requirements.contentPolicy).toContain('standard');
  });

  it('enterprise profile should require audit logging', () => {
    const profile = COMPLIANCE_PROFILES.enterprise;
    expect(profile.requirements.auditLogging).toBe(true);
  });

  it('regulated profile should have strictest requirements', () => {
    const profile = COMPLIANCE_PROFILES.regulated;
    expect(profile.requirements.contentPolicy).toContain('strict');
    expect(profile.requirements.auditLogging).toBe(true);
    expect(profile.requirements.retentionDays).toBeGreaterThan(0);
  });

  it('custom profile should be most flexible', () => {
    const profile = COMPLIANCE_PROFILES.custom;
    expect(profile.requirements.contentPolicy).toContain('permissive');
  });
});

describe('Safety Hard Stops', () => {
  it('should block real person impersonation by default', () => {
    const ai = createTestAI();
    const hardStop = ai.safety.hardStops.find(
      hs => hs.category === 'real_person_impersonation'
    );

    expect(hardStop).toBeDefined();
    expect(hardStop!.enabled).toBe(true);
  });

  it('should block copyrighted characters by default', () => {
    const ai = createTestAI();
    const hardStop = ai.safety.hardStops.find(
      hs => hs.category === 'copyrighted_character'
    );

    expect(hardStop).toBeDefined();
    expect(hardStop!.enabled).toBe(true);
  });

  it('should block illegal activity by default', () => {
    const ai = createTestAI();
    const hardStop = ai.safety.hardStops.find(
      hs => hs.category === 'illegal_activity'
    );

    expect(hardStop).toBeDefined();
    expect(hardStop!.enabled).toBe(true);
  });

  it('should block self-harm by default', () => {
    const ai = createTestAI();
    const hardStop = ai.safety.hardStops.find(
      hs => hs.category === 'self_harm'
    );

    expect(hardStop).toBeDefined();
    expect(hardStop!.enabled).toBe(true);
  });
});

describe('Dependency Prevention', () => {
  it('should be enabled by default', () => {
    const ai = createTestAI();
    expect(ai.safety.dependencyPrevention.enabled).toBe(true);
  });

  it('should have medium sensitivity by default', () => {
    const ai = createTestAI();
    expect(ai.safety.dependencyPrevention.sensitivity).toBe('medium');
  });

  it('should have high sensitivity for companion category', () => {
    const ai = createTestAI({ purposeCategory: 'companion' });
    expect(ai.safety.dependencyPrevention.sensitivity).toBe('high');
  });
});
