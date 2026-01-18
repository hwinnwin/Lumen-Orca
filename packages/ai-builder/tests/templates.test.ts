/**
 * MVP Templates Tests
 */

import { describe, it, expect } from 'vitest';
import {
  MVP_TEMPLATES,
  getTemplate,
  getAllTemplates,
  getTemplatesByCategory,
  templateToBuilderInput,
  type TemplateId,
} from '../src/templates/mvp-templates';
import { buildAI } from '../src/core/builder-service';
import type { UserId } from '../src/core/ai-object';

const testUserId = 'test_user_123' as UserId;

describe('MVP Templates', () => {
  describe('getTemplate()', () => {
    const templateIds: TemplateId[] = [
      'business_analyst',
      'executive_assistant',
      'content_strategist',
      'coach',
      'research_assistant',
      'companion',
    ];

    it.each(templateIds)('should return %s template', (id) => {
      const template = getTemplate(id);

      expect(template).toBeDefined();
      expect(template!.id).toBe(id);
      expect(template!.name).toBeDefined();
      expect(template!.description).toBeDefined();
    });

    it('should return undefined for unknown template', () => {
      const template = getTemplate('unknown' as TemplateId);
      expect(template).toBeUndefined();
    });
  });

  describe('getAllTemplates()', () => {
    it('should return all 6 templates', () => {
      const templates = getAllTemplates();
      expect(templates.length).toBe(6);
    });

    it('should return templates sorted by sortOrder', () => {
      const templates = getAllTemplates();
      for (let i = 1; i < templates.length; i++) {
        expect(templates[i].sortOrder).toBeGreaterThanOrEqual(templates[i - 1].sortOrder);
      }
    });
  });

  describe('getTemplatesByCategory()', () => {
    it('should return business templates', () => {
      const templates = getTemplatesByCategory('business');
      expect(templates.length).toBeGreaterThan(0);
      templates.forEach(t => expect(t.category).toBe('business'));
    });

    it('should return productivity templates', () => {
      const templates = getTemplatesByCategory('productivity');
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should return coaching templates', () => {
      const templates = getTemplatesByCategory('coaching');
      expect(templates.length).toBeGreaterThan(0);
    });
  });

  describe('templateToBuilderInput()', () => {
    it('should convert template to BuilderInput', () => {
      const template = getTemplate('business_analyst')!;
      const input = templateToBuilderInput(template, 'My Analyst', 'Custom purpose');

      expect(input.name).toBe('My Analyst');
      expect(input.purpose).toBe('Custom purpose');
      expect(input.templateId).toBe('business_analyst');
      expect(input.purposeCategory).toBe(template.category);
    });

    it('should use template purpose if not provided', () => {
      const template = getTemplate('business_analyst')!;
      const input = templateToBuilderInput(template, 'My Analyst');

      expect(input.purpose).toBe(template.defaults.purpose);
    });

    it('should inherit template capabilities', () => {
      const template = getTemplate('business_analyst')!;
      const input = templateToBuilderInput(template, 'My Analyst');

      expect(input.capabilities).toEqual(template.defaults.capabilities);
    });

    it('should inherit template tone settings', () => {
      const template = getTemplate('business_analyst')!;
      const input = templateToBuilderInput(template, 'My Analyst');

      expect(input.formality).toBe(template.defaults.formality);
      expect(input.verbosity).toBe(template.defaults.verbosity);
    });
  });

  describe('Template builds', () => {
    const templateIds: TemplateId[] = [
      'business_analyst',
      'executive_assistant',
      'content_strategist',
      'coach',
      'research_assistant',
      'companion',
    ];

    it.each(templateIds)('%s template should build successfully', (id) => {
      const template = getTemplate(id)!;
      const input = templateToBuilderInput(template, `Test ${template.name}`);
      const result = buildAI(input, testUserId);

      expect(result.aiObject).toBeDefined();
      expect(result.compiledPrompt.systemPrompt.length).toBeGreaterThan(0);
      expect(result.warnings.filter(w => w.severity === 'error').length).toBe(0);
    });
  });

  describe('Template characteristics', () => {
    it('business_analyst should have analytical decision style', () => {
      const template = getTemplate('business_analyst')!;
      expect(template.defaults.decisionStyle).toBe('analytical');
    });

    it('executive_assistant should be professional', () => {
      const template = getTemplate('executive_assistant')!;
      expect(template.defaults.formality).toBe('professional');
    });

    it('content_strategist should be creative-focused', () => {
      const template = getTemplate('content_strategist')!;
      expect(template.category).toBe('creative');
    });

    it('coach should be supportive', () => {
      const template = getTemplate('coach')!;
      expect(template.defaults.decisionStyle).toBe('supportive');
      expect(template.defaults.emotionalTemperature).toBe('warm');
    });

    it('research_assistant should be detailed', () => {
      const template = getTemplate('research_assistant')!;
      expect(template.defaults.verbosity).toBe('detailed');
    });

    it('companion should have enhanced dependency prevention', () => {
      const template = getTemplate('companion')!;
      const input = templateToBuilderInput(template, 'Test Companion');
      const result = buildAI(input, testUserId);

      expect(result.aiObject.safety.dependencyPrevention.enabled).toBe(true);
      expect(result.aiObject.safety.dependencyPrevention.sensitivity).toBe('high');
    });
  });
});

describe('Template Content', () => {
  it('each template should have required fields', () => {
    MVP_TEMPLATES.forEach(template => {
      expect(template.id).toBeDefined();
      expect(template.name).toBeDefined();
      expect(template.description).toBeDefined();
      expect(template.category).toBeDefined();
      expect(template.icon).toBeDefined();
      expect(template.defaults).toBeDefined();
      expect(template.defaults.purpose).toBeDefined();
      expect(template.defaults.capabilities.length).toBeGreaterThan(0);
    });
  });

  it('each template should have unique ID', () => {
    const ids = MVP_TEMPLATES.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('templates should have reasonable capability counts', () => {
    MVP_TEMPLATES.forEach(template => {
      expect(template.defaults.capabilities.length).toBeGreaterThanOrEqual(3);
      expect(template.defaults.capabilities.length).toBeLessThanOrEqual(10);
    });
  });
});
