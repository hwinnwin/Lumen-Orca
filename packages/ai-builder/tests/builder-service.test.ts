/**
 * AI Builder Service Tests
 */

import { describe, it, expect } from 'vitest';
import {
  AIBuilderService,
  buildAI,
  quickBuildAI,
  previewPrompt,
  type BuilderInput,
  type QuickBuildPreset,
} from '../src/core/builder-service';
import type { UserId } from '../src/core/ai-object';

const testUserId = 'test_user_123' as UserId;

const validInput: BuilderInput = {
  name: 'Test AI',
  purpose: 'Help with testing and validation tasks',
  purposeCategory: 'business',
  capabilities: ['Run tests', 'Validate data', 'Generate reports'],
  exclusions: ['Make predictions', 'Access external systems'],
  strictness: 3,
  prohibitions: ['Provide financial advice'],
  emotionalTemperature: 'neutral',
  formality: 'professional',
  verbosity: 'standard',
  contentPolicy: 'standard',
  disallowedTopics: ['politics'],
  memoryMode: 'session',
};

describe('AIBuilderService', () => {
  describe('build()', () => {
    it('should build an AI object from valid input', () => {
      const result = buildAI(validInput, testUserId);

      expect(result.aiObject).toBeDefined();
      expect(result.aiObject.name).toBe('Test AI');
      expect(result.aiObject.ownerId).toBe(testUserId);
      expect(result.aiObject.status).toBe('draft');
    });

    it('should generate a compiled prompt', () => {
      const result = buildAI(validInput, testUserId);

      expect(result.compiledPrompt).toBeDefined();
      expect(result.compiledPrompt.systemPrompt).toContain('SYSTEM FOUNDATION');
      expect(result.compiledPrompt.systemPrompt).toContain('YOUR ROLE');
      expect(result.compiledPrompt.systemPrompt).toContain('COMMUNICATION STYLE');
    });

    it('should include safety rules in compiled prompt', () => {
      const result = buildAI(validInput, testUserId);

      expect(result.compiledPrompt.systemPrompt).toContain('Never impersonate real individuals');
      expect(result.compiledPrompt.systemPrompt).toContain('Never provide assistance with illegal activities');
    });

    it('should include purpose and capabilities', () => {
      const result = buildAI(validInput, testUserId);

      expect(result.aiObject.purpose.statement).toBe(validInput.purpose);
      expect(result.aiObject.purpose.capabilities).toEqual(validInput.capabilities);
      expect(result.aiObject.purpose.exclusions).toEqual(validInput.exclusions);
    });

    it('should apply strictness level', () => {
      const strictInput = { ...validInput, strictness: 5 as const };
      const result = buildAI(strictInput, testUserId);

      expect(result.aiObject.behavior.strictness).toBe(5);
      expect(result.compiledPrompt.systemPrompt).toContain('Strictly enforce all guidelines');
    });

    it('should apply tone settings', () => {
      const result = buildAI(validInput, testUserId);

      expect(result.aiObject.tone.temperature).toBe('neutral');
      expect(result.aiObject.tone.formality).toBe('professional');
      expect(result.aiObject.tone.verbosity).toBe('standard');
    });

    it('should include runtime interceptors', () => {
      const result = buildAI(validInput, testUserId);

      expect(result.compiledPrompt.interceptors).toBeDefined();
      expect(Array.isArray(result.compiledPrompt.interceptors)).toBe(true);
    });

    it('should include build metadata', () => {
      const result = buildAI(validInput, testUserId);

      expect(result.buildMeta).toBeDefined();
      expect(result.buildMeta.builtAt).toBeInstanceOf(Date);
      expect(result.buildMeta.builderVersion).toBe('1.0.0');
      expect(result.buildMeta.estimatedTokens).toBeGreaterThan(0);
    });

    it('should create version history entry', () => {
      const result = buildAI(validInput, testUserId);

      expect(result.aiObject.version.versionNumber).toBe('1.0.0');
      expect(result.aiObject.version.isLocked).toBe(false);
    });
  });

  describe('build() validation', () => {
    it('should error on empty name', () => {
      const invalidInput = { ...validInput, name: '' };

      expect(() => buildAI(invalidInput, testUserId)).toThrow('Build failed');
    });

    it('should error on empty purpose', () => {
      const invalidInput = { ...validInput, purpose: '' };

      expect(() => buildAI(invalidInput, testUserId)).toThrow('Build failed');
    });

    it('should warn on short purpose', () => {
      const shortPurpose = { ...validInput, purpose: 'Help' };
      const result = buildAI(shortPurpose, testUserId);

      expect(result.warnings.some(w => w.code === 'PURPOSE_TOO_SHORT')).toBe(true);
    });

    it('should warn on companion category', () => {
      const companionInput = { ...validInput, purposeCategory: 'companion' as const };
      const result = buildAI(companionInput, testUserId);

      expect(result.warnings.some(w => w.code === 'COMPANION_CATEGORY')).toBe(true);
    });

    it('should warn on strictness/formality mismatch', () => {
      const mismatchInput = {
        ...validInput,
        strictness: 5 as const,
        formality: 'casual' as const,
      };
      const result = buildAI(mismatchInput, testUserId);

      expect(result.warnings.some(w => w.code === 'STRICTNESS_FORMALITY_MISMATCH')).toBe(true);
    });
  });

  describe('quickBuild()', () => {
    const presets: QuickBuildPreset[] = [
      'professional_assistant',
      'friendly_helper',
      'strict_analyst',
      'creative_partner',
      'supportive_coach',
    ];

    it.each(presets)('should build from %s preset', (preset) => {
      const result = quickBuildAI(preset, 'Quick AI', 'Help with tasks', testUserId);

      expect(result.aiObject).toBeDefined();
      expect(result.aiObject.name).toBe('Quick AI');
      expect(result.compiledPrompt.systemPrompt.length).toBeGreaterThan(0);
    });

    it('should apply professional_assistant preset correctly', () => {
      const result = quickBuildAI('professional_assistant', 'Pro AI', 'Business tasks', testUserId);

      expect(result.aiObject.tone.formality).toBe('professional');
      expect(result.aiObject.tone.temperature).toBe('neutral');
    });

    it('should apply friendly_helper preset correctly', () => {
      const result = quickBuildAI('friendly_helper', 'Friendly AI', 'Help tasks', testUserId);

      expect(result.aiObject.tone.formality).toBe('casual');
      expect(result.aiObject.tone.temperature).toBe('warm');
    });

    it('should apply strict_analyst preset correctly', () => {
      const result = quickBuildAI('strict_analyst', 'Analyst AI', 'Analysis tasks', testUserId);

      expect(result.aiObject.behavior.strictness).toBe(5);
      expect(result.aiObject.tone.formality).toBe('formal');
    });
  });

  describe('rebuild()', () => {
    it('should preserve ID when rebuilding', () => {
      const service = new AIBuilderService();
      const initial = service.build(validInput, testUserId);
      const rebuilt = service.rebuild(initial.aiObject, { name: 'Updated AI' });

      expect(rebuilt.aiObject.id).toBe(initial.aiObject.id);
    });

    it('should increment version number', () => {
      const service = new AIBuilderService();
      const initial = service.build(validInput, testUserId);
      const rebuilt = service.rebuild(initial.aiObject, { name: 'Updated AI' });

      expect(rebuilt.aiObject.version.versionNumber).toBe('1.0.1');
    });

    it('should add to version history', () => {
      const service = new AIBuilderService();
      const initial = service.build(validInput, testUserId);
      const rebuilt = service.rebuild(initial.aiObject, { name: 'Updated AI' });

      expect(rebuilt.aiObject.version.history.length).toBe(1);
      expect(rebuilt.aiObject.version.history[0].versionNumber).toBe('1.0.0');
    });

    it('should preserve createdAt timestamp', () => {
      const service = new AIBuilderService();
      const initial = service.build(validInput, testUserId);
      const rebuilt = service.rebuild(initial.aiObject, { name: 'Updated AI' });

      expect(rebuilt.aiObject.createdAt).toEqual(initial.aiObject.createdAt);
    });

    it('should update the AI properties', () => {
      const service = new AIBuilderService();
      const initial = service.build(validInput, testUserId);
      const rebuilt = service.rebuild(initial.aiObject, {
        name: 'Updated AI',
        strictness: 5,
      });

      expect(rebuilt.aiObject.name).toBe('Updated AI');
      expect(rebuilt.aiObject.behavior.strictness).toBe(5);
    });
  });

  describe('preview()', () => {
    it('should return prompt string without creating AI object', () => {
      const prompt = previewPrompt(validInput);

      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
      expect(prompt).toContain('SYSTEM FOUNDATION');
    });
  });

  describe('estimateTokens()', () => {
    it('should return token estimate', () => {
      const service = new AIBuilderService();
      const tokens = service.estimateTokens(validInput);

      expect(typeof tokens).toBe('number');
      expect(tokens).toBeGreaterThan(0);
    });
  });
});

describe('Prompt Stack Layers', () => {
  it('should include all 6 layers', () => {
    const result = buildAI(validInput, testUserId);
    const prompt = result.compiledPrompt.systemPrompt;

    expect(prompt).toContain('SYSTEM FOUNDATION'); // Layer 1
    expect(prompt).toContain('YOUR ROLE');         // Layer 2
    expect(prompt).toContain('COMMUNICATION STYLE'); // Layer 3
    expect(prompt).toContain('TASK FOCUS');        // Layer 4
    expect(prompt).toContain('SESSION BEHAVIOR');  // Layer 5
    // Layer 6 (Interceptor) is runtime, checked via interceptors array
    expect(result.compiledPrompt.interceptors.length).toBeGreaterThan(0);
  });

  it('should include core safety rules', () => {
    const result = buildAI(validInput, testUserId);
    const prompt = result.compiledPrompt.systemPrompt;

    expect(prompt).toContain('Never impersonate real individuals');
    expect(prompt).toContain('copyrighted characters');
    expect(prompt).toContain('illegal activities');
  });

  it('should include legal constraints', () => {
    const result = buildAI(validInput, testUserId);
    const prompt = result.compiledPrompt.systemPrompt;

    expect(prompt).toContain('legal advice');
    expect(prompt).toContain('medical advice');
    expect(prompt).toContain('financial advice');
  });

  it('should include AI disclosure requirements', () => {
    const result = buildAI(validInput, testUserId);
    const prompt = result.compiledPrompt.systemPrompt;

    expect(prompt).toContain('acknowledge being an AI');
    expect(prompt).toContain('Never claim to be human');
  });
});

describe('Safety Interceptors', () => {
  it('should create safety interceptors from hard stops', () => {
    const result = buildAI(validInput, testUserId);
    const interceptors = result.compiledPrompt.interceptors;

    const safetyInterceptors = interceptors.filter(i => i.id.startsWith('safety_'));
    expect(safetyInterceptors.length).toBeGreaterThan(0);
  });

  it('should create drift detection interceptor when topics are forbidden', () => {
    const inputWithForbiddenTopics = {
      ...validInput,
      disallowedTopics: ['politics', 'religion'],
    };
    const result = buildAI(inputWithForbiddenTopics, testUserId);
    const interceptors = result.compiledPrompt.interceptors;

    const driftInterceptor = interceptors.find(i => i.id === 'drift_detection');
    expect(driftInterceptor).toBeDefined();
  });

  it('should create dependency detection interceptor', () => {
    const result = buildAI(validInput, testUserId);
    const interceptors = result.compiledPrompt.interceptors;

    const dependencyInterceptor = interceptors.find(i => i.id === 'dependency_detection');
    expect(dependencyInterceptor).toBeDefined();
  });

  it('should detect dependency language', () => {
    const result = buildAI(validInput, testUserId);
    const dependencyInterceptor = result.compiledPrompt.interceptors.find(
      i => i.id === 'dependency_detection'
    );

    const checkResult = dependencyInterceptor!.check("you're the only one who understands me");
    expect(checkResult.triggered).toBe(true);
    expect(checkResult.severity).toBe('warn');
  });
});
