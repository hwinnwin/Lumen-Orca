/**
 * AI Builder Platform — Builder Service
 *
 * THE KEY ABSTRACTION: Translate human intent → machine rules
 *
 * Users answer simple questions.
 * We engineer reliable, safe, high-performance prompt stacks.
 *
 * User pain: "I want an AI that behaves correctly and consistently"
 * Our solution: "Describe what you want. We engineer the intelligence."
 */

import type {
  AIObject,
  AIObjectId,
  UserId,
  AIPurposeCategory,
  StrictnessLevel,
  EmotionalTemperature,
  Formality,
  Verbosity,
  DecisionStyle,
  AmbiguityHandling,
  OutputStructure,
  ContentPolicyLevel,
  MemoryMode,
} from './ai-object';

import {
  createAIObjectId,
  createVersionId,
  createDefaultAIObject,
} from './ai-object';

import { compilePromptStack, type CompiledPrompt } from './prompt-stack';

// ============================================================================
// BUILDER INPUT TYPES
// ============================================================================

/**
 * User-facing builder configuration
 * This is what users interact with — no technical jargon.
 */
export interface BuilderInput {
  /** Basic Info */
  name: string;
  purpose: string;

  /** Purpose Configuration */
  purposeCategory: AIPurposeCategory;
  capabilities: string[];
  exclusions: string[];

  /** Behavior Configuration */
  strictness: StrictnessLevel;
  prohibitions: string[];

  /** Tone Configuration */
  emotionalTemperature: EmotionalTemperature;
  formality: Formality;
  verbosity: Verbosity;

  /** Safety Configuration */
  contentPolicy: ContentPolicyLevel;
  disallowedTopics: string[];

  /** Memory Configuration */
  memoryMode: MemoryMode;

  /** Template to base on (optional) */
  templateId?: string;

  /** Advanced Options (optional) */
  advanced?: AdvancedBuilderOptions;
}

export interface AdvancedBuilderOptions {
  /** Role title override */
  roleTitle?: string;

  /** Decision-making style */
  decisionStyle?: DecisionStyle;

  /** Ambiguity handling */
  ambiguityHandling?: AmbiguityHandling;

  /** Output structure preference */
  outputStructure?: OutputStructure;

  /** Technical terminology usage */
  useTechnicalTerms?: boolean;

  /** Include examples in responses */
  useExamples?: boolean;

  /** Custom persona traits */
  personaTraits?: string[];

  /** Custom prohibitions for impersonation */
  noImpersonate?: string[];
}

// ============================================================================
// QUICK BUILD PRESETS
// ============================================================================

export type QuickBuildPreset =
  | 'professional_assistant'
  | 'friendly_helper'
  | 'strict_analyst'
  | 'creative_partner'
  | 'supportive_coach';

export const QUICK_BUILD_CONFIGS: Record<QuickBuildPreset, Partial<BuilderInput>> = {
  professional_assistant: {
    formality: 'professional',
    emotionalTemperature: 'neutral',
    verbosity: 'standard',
    strictness: 3,
    contentPolicy: 'standard',
    memoryMode: 'session',
  },
  friendly_helper: {
    formality: 'casual',
    emotionalTemperature: 'warm',
    verbosity: 'standard',
    strictness: 2,
    contentPolicy: 'standard',
    memoryMode: 'session',
  },
  strict_analyst: {
    formality: 'formal',
    emotionalTemperature: 'cold',
    verbosity: 'detailed',
    strictness: 5,
    contentPolicy: 'strict',
    memoryMode: 'session',
  },
  creative_partner: {
    formality: 'casual',
    emotionalTemperature: 'warm',
    verbosity: 'standard',
    strictness: 2,
    contentPolicy: 'standard',
    memoryMode: 'session',
  },
  supportive_coach: {
    formality: 'balanced',
    emotionalTemperature: 'warm',
    verbosity: 'detailed',
    strictness: 3,
    contentPolicy: 'standard',
    memoryMode: 'selective',
  },
};

// ============================================================================
// BUILDER SERVICE
// ============================================================================

export interface BuildResult {
  /** The created AI object */
  aiObject: AIObject;

  /** The compiled prompt stack */
  compiledPrompt: CompiledPrompt;

  /** Validation warnings (if any) */
  warnings: BuildWarning[];

  /** Build metadata */
  buildMeta: BuildMetadata;
}

export interface BuildWarning {
  /** Warning code */
  code: string;

  /** Warning message */
  message: string;

  /** Severity */
  severity: 'info' | 'warning' | 'error';

  /** Field that triggered the warning */
  field?: string;
}

export interface BuildMetadata {
  /** Build timestamp */
  builtAt: Date;

  /** Builder version */
  builderVersion: string;

  /** Template used (if any) */
  templateUsed?: string;

  /** Estimated prompt tokens */
  estimatedTokens: number;
}

/**
 * Main Builder Service
 *
 * Translates user intent into a fully configured AI object
 * with compiled prompt stack.
 */
export class AIBuilderService {
  private readonly builderVersion = '1.0.0';

  /**
   * Build an AI from user input
   */
  build(input: BuilderInput, ownerId: UserId): BuildResult {
    const warnings: BuildWarning[] = [];

    // Validate input
    const validationWarnings = this.validateInput(input);
    warnings.push(...validationWarnings);

    // Check for blocking errors
    const blockingErrors = warnings.filter(w => w.severity === 'error');
    if (blockingErrors.length > 0) {
      throw new BuildError('Build failed due to validation errors', blockingErrors);
    }

    // Create base AI object
    const aiObject = this.createAIObject(input, ownerId);

    // Compile prompt stack
    const compiledPrompt = compilePromptStack(aiObject);

    // Build metadata
    const buildMeta: BuildMetadata = {
      builtAt: new Date(),
      builderVersion: this.builderVersion,
      templateUsed: input.templateId,
      estimatedTokens: compiledPrompt.metadata.estimatedTokens,
    };

    return {
      aiObject,
      compiledPrompt,
      warnings,
      buildMeta,
    };
  }

  /**
   * Quick build from preset
   */
  quickBuild(
    preset: QuickBuildPreset,
    name: string,
    purpose: string,
    ownerId: UserId
  ): BuildResult {
    const presetConfig = QUICK_BUILD_CONFIGS[preset];

    const input: BuilderInput = {
      name,
      purpose,
      purposeCategory: 'custom',
      capabilities: [],
      exclusions: [],
      prohibitions: [],
      disallowedTopics: [],
      ...presetConfig,
      strictness: presetConfig.strictness || 3,
      emotionalTemperature: presetConfig.emotionalTemperature || 'neutral',
      formality: presetConfig.formality || 'balanced',
      verbosity: presetConfig.verbosity || 'standard',
      contentPolicy: presetConfig.contentPolicy || 'standard',
      memoryMode: presetConfig.memoryMode || 'session',
    };

    return this.build(input, ownerId);
  }

  /**
   * Rebuild an existing AI object with modifications
   */
  rebuild(
    existingAI: AIObject,
    modifications: Partial<BuilderInput>
  ): BuildResult {
    // Extract current config from AI object
    const currentConfig = this.extractConfig(existingAI);

    // Merge with modifications
    const mergedConfig: BuilderInput = {
      ...currentConfig,
      ...modifications,
    };

    // Rebuild
    const result = this.build(mergedConfig, existingAI.ownerId);

    // Create snapshot without version property
    const { version: _version, ...snapshotWithoutVersion } = existingAI;

    // Preserve ID and increment version by creating new object
    const updatedAIObject: AIObject = {
      ...result.aiObject,
      id: existingAI.id,
      createdAt: existingAI.createdAt,
      version: {
        ...result.aiObject.version,
        history: [
          ...existingAI.version.history,
          {
            versionId: existingAI.version.currentVersionId,
            versionNumber: existingAI.version.versionNumber,
            createdAt: existingAI.updatedAt,
            createdBy: existingAI.ownerId,
            changeSummary: 'Previous version',
            snapshot: snapshotWithoutVersion,
          },
        ],
        versionNumber: this.incrementVersion(existingAI.version.versionNumber),
      },
    };

    return {
      ...result,
      aiObject: updatedAIObject,
    };
  }

  /**
   * Preview prompt without creating AI object
   */
  preview(input: BuilderInput): string {
    const tempAI = this.createAIObject(input, 'preview' as UserId);
    const compiled = compilePromptStack(tempAI);
    return compiled.systemPrompt;
  }

  /**
   * Estimate token usage for a configuration
   */
  estimateTokens(input: BuilderInput): number {
    const preview = this.preview(input);
    return Math.ceil(preview.length / 4);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private validateInput(input: BuilderInput): BuildWarning[] {
    const warnings: BuildWarning[] = [];

    // Name validation
    if (!input.name || input.name.trim().length === 0) {
      warnings.push({
        code: 'EMPTY_NAME',
        message: 'AI name is required',
        severity: 'error',
        field: 'name',
      });
    } else if (input.name.length > 100) {
      warnings.push({
        code: 'NAME_TOO_LONG',
        message: 'AI name should be under 100 characters',
        severity: 'warning',
        field: 'name',
      });
    }

    // Purpose validation
    if (!input.purpose || input.purpose.trim().length === 0) {
      warnings.push({
        code: 'EMPTY_PURPOSE',
        message: 'Purpose description is required',
        severity: 'error',
        field: 'purpose',
      });
    } else if (input.purpose.length < 10) {
      warnings.push({
        code: 'PURPOSE_TOO_SHORT',
        message: 'Purpose description should be more detailed',
        severity: 'warning',
        field: 'purpose',
      });
    }

    // Strictness validation
    if (input.strictness < 1 || input.strictness > 5) {
      warnings.push({
        code: 'INVALID_STRICTNESS',
        message: 'Strictness must be between 1 and 5',
        severity: 'error',
        field: 'strictness',
      });
    }

    // High strictness with low formality warning
    if (input.strictness >= 4 && input.formality === 'casual') {
      warnings.push({
        code: 'STRICTNESS_FORMALITY_MISMATCH',
        message: 'High strictness with casual formality may produce inconsistent results',
        severity: 'info',
        field: 'strictness',
      });
    }

    // Companion category warning
    if (input.purposeCategory === 'companion') {
      warnings.push({
        code: 'COMPANION_CATEGORY',
        message: 'Companion AIs have additional safety measures to prevent dependency',
        severity: 'info',
        field: 'purposeCategory',
      });
    }

    // Empty capabilities for non-custom category
    if (
      input.purposeCategory !== 'custom' &&
      input.capabilities.length === 0
    ) {
      warnings.push({
        code: 'NO_CAPABILITIES',
        message: 'Consider adding specific capabilities for better AI behavior',
        severity: 'info',
        field: 'capabilities',
      });
    }

    return warnings;
  }

  private createAIObject(input: BuilderInput, ownerId: UserId): AIObject {
    const base = createDefaultAIObject(ownerId, input.name, input.purpose);
    const advanced = input.advanced || {};

    // Purpose
    base.purpose.category = input.purposeCategory;
    base.purpose.capabilities = input.capabilities;
    base.purpose.exclusions = input.exclusions;

    // Role
    if (advanced.roleTitle) {
      base.role.title = advanced.roleTitle;
    } else {
      base.role.title = this.inferRoleTitle(input.purposeCategory, input.purpose);
    }
    base.role.description = `An AI assistant focused on: ${input.purpose}`;
    base.role.decisionStyle = advanced.decisionStyle || 'consultative';

    if (advanced.personaTraits && advanced.personaTraits.length > 0) {
      base.role.persona = {
        traits: advanced.personaTraits,
        isOriginal: true,
      };
    }

    // Behavior
    base.behavior.strictness = input.strictness;
    base.behavior.prohibitions = input.prohibitions;
    base.behavior.ambiguityHandling = advanced.ambiguityHandling || 'ask_first';

    // Add scope boundaries from disallowed topics
    if (input.disallowedTopics.length > 0) {
      base.behavior.scopeBoundaries.push({
        type: 'topic',
        allowed: [],
        forbidden: input.disallowedTopics,
        outOfScopeResponse: 'I\'m not configured to discuss that topic.',
      });
    }

    // Tone
    base.tone.temperature = input.emotionalTemperature;
    base.tone.formality = input.formality;
    base.tone.verbosity = input.verbosity;
    base.tone.languageStyle.useTechnicalTerms = advanced.useTechnicalTerms ?? false;
    base.tone.languageStyle.useExamples = advanced.useExamples ?? true;

    // Output format
    base.outputFormat.defaultStructure = advanced.outputStructure || 'conversational';

    // Safety
    base.safety.contentPolicy = input.contentPolicy;

    // Enhance dependency prevention for companion category
    if (input.purposeCategory === 'companion') {
      base.safety.dependencyPrevention = {
        enabled: true,
        sensitivity: 'high',
        interventionStyle: 'gentle_reminder',
        customMessage: 'I\'m here to help, but I encourage you to also connect with people in your life. Is there something specific I can assist with?',
      };
    }

    // Add custom no-impersonate rules
    if (advanced.noImpersonate && advanced.noImpersonate.length > 0) {
      for (const entity of advanced.noImpersonate) {
        base.safety.softBoundaries.push({
          name: `no_impersonate_${entity}`,
          pattern: entity.toLowerCase(),
          warning: `I cannot impersonate or roleplay as ${entity}.`,
          allowOverride: false,
        });
      }
    }

    // Memory
    base.memory.mode = input.memoryMode;

    // Template reference
    if (input.templateId) {
      base.templateId = input.templateId;
    }

    return base;
  }

  private inferRoleTitle(category: AIPurposeCategory, purpose: string): string {
    const categoryTitles: Record<AIPurposeCategory, string> = {
      business: 'Business Assistant',
      productivity: 'Productivity Assistant',
      creative: 'Creative Assistant',
      education: 'Educational Assistant',
      coaching: 'Personal Coach',
      research: 'Research Assistant',
      companion: 'Conversational Companion',
      custom: 'AI Assistant',
    };

    return categoryTitles[category];
  }

  private extractConfig(ai: AIObject): BuilderInput {
    return {
      name: ai.name,
      purpose: ai.purpose.statement,
      purposeCategory: ai.purpose.category,
      capabilities: ai.purpose.capabilities,
      exclusions: ai.purpose.exclusions,
      strictness: ai.behavior.strictness,
      prohibitions: ai.behavior.prohibitions,
      emotionalTemperature: ai.tone.temperature,
      formality: ai.tone.formality,
      verbosity: ai.tone.verbosity,
      contentPolicy: ai.safety.contentPolicy,
      disallowedTopics: ai.behavior.scopeBoundaries
        .filter(b => b.type === 'topic')
        .flatMap(b => b.forbidden),
      memoryMode: ai.memory.mode,
      templateId: ai.templateId,
      advanced: {
        roleTitle: ai.role.title,
        decisionStyle: ai.role.decisionStyle,
        ambiguityHandling: ai.behavior.ambiguityHandling,
        outputStructure: ai.outputFormat.defaultStructure,
        useTechnicalTerms: ai.tone.languageStyle.useTechnicalTerms,
        useExamples: ai.tone.languageStyle.useExamples,
        personaTraits: ai.role.persona?.traits,
      },
    };
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.').map(Number);
    parts[2] = (parts[2] || 0) + 1;
    return parts.join('.');
  }
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class BuildError extends Error {
  constructor(
    message: string,
    public readonly warnings: BuildWarning[]
  ) {
    super(message);
    this.name = 'BuildError';
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let builderInstance: AIBuilderService | null = null;

export function getBuilderService(): AIBuilderService {
  if (!builderInstance) {
    builderInstance = new AIBuilderService();
  }
  return builderInstance;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export function buildAI(input: BuilderInput, ownerId: UserId): BuildResult {
  return getBuilderService().build(input, ownerId);
}

export function quickBuildAI(
  preset: QuickBuildPreset,
  name: string,
  purpose: string,
  ownerId: UserId
): BuildResult {
  return getBuilderService().quickBuild(preset, name, purpose, ownerId);
}

export function previewPrompt(input: BuilderInput): string {
  return getBuilderService().preview(input);
}
