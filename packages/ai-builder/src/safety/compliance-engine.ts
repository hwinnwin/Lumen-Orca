/**
 * AI Builder Platform — Safety & Compliance Engine
 *
 * BUILT-IN, NOT BOLTED-ON.
 *
 * Why this matters:
 * - App stores require content safety
 * - Payment processors require compliance
 * - Enterprise buyers require audit trails
 * - Longevity requires being boring in the best way
 */

import type { AIObject, HardStopCategory } from '../core/ai-object';
import type { RuntimeInterceptor, InterceptorResult } from '../core/prompt-stack';

// ============================================================================
// COMPLIANCE TYPES
// ============================================================================

export type ComplianceLevel = 'app_store' | 'enterprise' | 'regulated' | 'custom';

export interface ComplianceProfile {
  /** Profile identifier */
  id: string;

  /** Profile name */
  name: string;

  /** Description */
  description: string;

  /** Required safety rules */
  requiredRules: HardStopCategory[];

  /** Content restrictions */
  contentRestrictions: ContentRestriction[];

  /** Audit requirements */
  auditRequirements: AuditRequirement[];

  /** Disclosure requirements */
  disclosureRequirements: DisclosureRequirement[];
}

export interface ContentRestriction {
  /** Restriction type */
  type: 'topic' | 'language' | 'format' | 'output';

  /** What is restricted */
  restricted: string[];

  /** Enforcement level */
  enforcement: 'block' | 'warn' | 'log';

  /** Reason for restriction */
  reason: string;
}

export interface AuditRequirement {
  /** What must be logged */
  event: string;

  /** Required fields */
  requiredFields: string[];

  /** Retention period (days) */
  retentionDays: number;

  /** Whether this is mandatory */
  mandatory: boolean;
}

export interface DisclosureRequirement {
  /** Disclosure type */
  type: 'ai_identity' | 'data_usage' | 'limitations' | 'custom';

  /** When to disclose */
  trigger: 'session_start' | 'on_request' | 'always' | 'periodic';

  /** Disclosure text */
  text: string;

  /** Whether user can dismiss */
  dismissible: boolean;
}

// ============================================================================
// COMPLIANCE PROFILES
// ============================================================================

export const COMPLIANCE_PROFILES: Record<ComplianceLevel, ComplianceProfile> = {
  app_store: {
    id: 'app_store',
    name: 'App Store Compliant',
    description: 'Meets requirements for iOS App Store and Google Play Store',
    requiredRules: [
      'real_person_impersonation',
      'copyrighted_character',
      'illegal_activity',
      'self_harm',
      'violence',
      'discrimination',
    ],
    contentRestrictions: [
      {
        type: 'topic',
        restricted: ['adult_content', 'gambling', 'hate_speech'],
        enforcement: 'block',
        reason: 'App store guidelines',
      },
      {
        type: 'output',
        restricted: ['explicit_imagery', 'gore', 'harassment'],
        enforcement: 'block',
        reason: 'App store guidelines',
      },
    ],
    auditRequirements: [
      {
        event: 'content_flag',
        requiredFields: ['timestamp', 'category', 'action_taken'],
        retentionDays: 90,
        mandatory: true,
      },
    ],
    disclosureRequirements: [
      {
        type: 'ai_identity',
        trigger: 'session_start',
        text: 'You are interacting with an AI assistant.',
        dismissible: true,
      },
    ],
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Compliant',
    description: 'Meets requirements for enterprise deployment with full audit trails',
    requiredRules: [
      'real_person_impersonation',
      'copyrighted_character',
      'illegal_activity',
      'self_harm',
      'violence',
      'discrimination',
      'misinformation',
      'privacy_violation',
    ],
    contentRestrictions: [
      {
        type: 'topic',
        restricted: ['competitor_information', 'confidential_data'],
        enforcement: 'warn',
        reason: 'Enterprise data protection',
      },
    ],
    auditRequirements: [
      {
        event: 'all_interactions',
        requiredFields: ['timestamp', 'user_id', 'ai_id', 'input_hash', 'output_hash'],
        retentionDays: 365,
        mandatory: true,
      },
      {
        event: 'content_flag',
        requiredFields: ['timestamp', 'category', 'severity', 'action_taken', 'reviewer'],
        retentionDays: 730,
        mandatory: true,
      },
      {
        event: 'configuration_change',
        requiredFields: ['timestamp', 'changed_by', 'previous_value', 'new_value'],
        retentionDays: 730,
        mandatory: true,
      },
    ],
    disclosureRequirements: [
      {
        type: 'ai_identity',
        trigger: 'session_start',
        text: 'This is an AI assistant. All interactions may be logged for compliance purposes.',
        dismissible: false,
      },
      {
        type: 'data_usage',
        trigger: 'session_start',
        text: 'Your interactions are processed in accordance with your organization\'s data policies.',
        dismissible: false,
      },
    ],
  },

  regulated: {
    id: 'regulated',
    name: 'Regulated Industry',
    description: 'Meets requirements for healthcare, finance, and legal industries',
    requiredRules: [
      'real_person_impersonation',
      'copyrighted_character',
      'illegal_activity',
      'self_harm',
      'violence',
      'discrimination',
      'misinformation',
      'privacy_violation',
    ],
    contentRestrictions: [
      {
        type: 'topic',
        restricted: ['medical_diagnosis', 'legal_advice', 'financial_advice'],
        enforcement: 'warn',
        reason: 'Professional licensing requirements',
      },
      {
        type: 'output',
        restricted: ['pii', 'phi', 'financial_data'],
        enforcement: 'block',
        reason: 'Data protection regulations',
      },
    ],
    auditRequirements: [
      {
        event: 'all_interactions',
        requiredFields: [
          'timestamp',
          'user_id',
          'ai_id',
          'session_id',
          'input_hash',
          'output_hash',
          'compliance_check_result',
        ],
        retentionDays: 2555, // 7 years
        mandatory: true,
      },
      {
        event: 'content_flag',
        requiredFields: [
          'timestamp',
          'category',
          'severity',
          'action_taken',
          'reviewer',
          'resolution',
        ],
        retentionDays: 2555,
        mandatory: true,
      },
    ],
    disclosureRequirements: [
      {
        type: 'ai_identity',
        trigger: 'always',
        text: 'AI Assistant - Not a licensed professional',
        dismissible: false,
      },
      {
        type: 'limitations',
        trigger: 'periodic',
        text: 'This AI cannot provide medical, legal, or financial advice. Please consult appropriate professionals.',
        dismissible: false,
      },
    ],
  },

  custom: {
    id: 'custom',
    name: 'Custom Compliance',
    description: 'Customizable compliance profile',
    requiredRules: [
      'real_person_impersonation',
      'copyrighted_character',
      'illegal_activity',
      'self_harm',
    ],
    contentRestrictions: [],
    auditRequirements: [],
    disclosureRequirements: [],
  },
};

// ============================================================================
// COMPLIANCE ENGINE
// ============================================================================

export interface ComplianceCheckResult {
  /** Whether the AI object is compliant */
  compliant: boolean;

  /** Compliance level achieved */
  level: ComplianceLevel | null;

  /** Violations found */
  violations: ComplianceViolation[];

  /** Warnings */
  warnings: ComplianceWarning[];

  /** Recommendations */
  recommendations: string[];
}

export interface ComplianceViolation {
  /** Violation code */
  code: string;

  /** Description */
  description: string;

  /** Required action */
  requiredAction: string;

  /** Field in violation */
  field: string;
}

export interface ComplianceWarning {
  /** Warning code */
  code: string;

  /** Description */
  description: string;

  /** Recommendation */
  recommendation: string;
}

export class ComplianceEngine {
  /**
   * Check if an AI object meets a compliance profile
   */
  checkCompliance(
    aiObject: AIObject,
    targetLevel: ComplianceLevel
  ): ComplianceCheckResult {
    const profile = COMPLIANCE_PROFILES[targetLevel];
    const violations: ComplianceViolation[] = [];
    const warnings: ComplianceWarning[] = [];
    const recommendations: string[] = [];

    // Check required safety rules
    for (const requiredRule of profile.requiredRules) {
      const hasRule = aiObject.safety.hardStops.some(
        hs => hs.category === requiredRule && hs.enabled
      );

      if (!hasRule) {
        violations.push({
          code: `MISSING_RULE_${requiredRule.toUpperCase()}`,
          description: `Required safety rule '${requiredRule}' is not enabled`,
          requiredAction: `Enable the '${requiredRule}' hard stop in safety configuration`,
          field: 'safety.hardStops',
        });
      }
    }

    // Check content restrictions
    for (const restriction of profile.contentRestrictions) {
      if (restriction.enforcement === 'block') {
        const hasBoundary = aiObject.behavior.scopeBoundaries.some(
          b => b.type === restriction.type &&
               restriction.restricted.some(r => b.forbidden.includes(r))
        );

        if (!hasBoundary) {
          warnings.push({
            code: `RECOMMENDED_RESTRICTION_${restriction.type.toUpperCase()}`,
            description: `Content restriction for ${restriction.type} is recommended`,
            recommendation: `Add scope boundaries for: ${restriction.restricted.join(', ')}`,
          });
        }
      }
    }

    // Check AI framing
    if (profile.disclosureRequirements.some(d => d.type === 'ai_identity')) {
      if (!aiObject.safety.aiFraming.alwaysIdentifyAsAI) {
        violations.push({
          code: 'MISSING_AI_DISCLOSURE',
          description: 'AI identity disclosure is required but not enabled',
          requiredAction: 'Enable "alwaysIdentifyAsAI" in safety.aiFraming',
          field: 'safety.aiFraming.alwaysIdentifyAsAI',
        });
      }
    }

    // Generate recommendations
    if (violations.length === 0 && warnings.length > 0) {
      recommendations.push(
        'AI object is compliant but could be improved with recommended changes.'
      );
    }

    if (aiObject.purpose.category === 'companion') {
      recommendations.push(
        'Consider enhancing dependency prevention for companion-type AIs.'
      );
    }

    if (targetLevel === 'enterprise' || targetLevel === 'regulated') {
      if (aiObject.memory.mode === 'persistent') {
        recommendations.push(
          'Review data retention policies for persistent memory mode.'
        );
      }
    }

    return {
      compliant: violations.length === 0,
      level: violations.length === 0 ? targetLevel : null,
      violations,
      warnings,
      recommendations,
    };
  }

  /**
   * Get the highest compliance level an AI object meets
   */
  getComplianceLevel(aiObject: AIObject): ComplianceLevel | null {
    const levels: ComplianceLevel[] = ['regulated', 'enterprise', 'app_store', 'custom'];

    for (const level of levels) {
      const result = this.checkCompliance(aiObject, level);
      if (result.compliant) {
        return level;
      }
    }

    return null;
  }

  /**
   * Apply compliance profile to an AI object
   */
  applyProfile(
    aiObject: AIObject,
    targetLevel: ComplianceLevel
  ): AIObject {
    const profile = COMPLIANCE_PROFILES[targetLevel];
    const modified = { ...aiObject };

    // Enable all required safety rules
    for (const requiredRule of profile.requiredRules) {
      const existingIndex = modified.safety.hardStops.findIndex(
        hs => hs.category === requiredRule
      );

      if (existingIndex >= 0) {
        modified.safety.hardStops[existingIndex].enabled = true;
      } else {
        modified.safety.hardStops.push({
          category: requiredRule,
          enabled: true,
        });
      }
    }

    // Enable AI disclosure
    if (profile.disclosureRequirements.some(d => d.type === 'ai_identity')) {
      modified.safety.aiFraming.alwaysIdentifyAsAI = true;
    }

    // Add content restrictions as scope boundaries
    for (const restriction of profile.contentRestrictions) {
      if (restriction.enforcement === 'block') {
        modified.behavior.scopeBoundaries.push({
          type: restriction.type as 'topic' | 'action' | 'domain',
          allowed: [],
          forbidden: restriction.restricted,
          outOfScopeResponse: restriction.reason,
        });
      }
    }

    return modified;
  }

  /**
   * Generate compliance report
   */
  generateReport(aiObject: AIObject): ComplianceReport {
    const appStore = this.checkCompliance(aiObject, 'app_store');
    const enterprise = this.checkCompliance(aiObject, 'enterprise');
    const regulated = this.checkCompliance(aiObject, 'regulated');

    const currentLevel = this.getComplianceLevel(aiObject);

    return {
      generatedAt: new Date(),
      aiObjectId: aiObject.id,
      aiObjectName: aiObject.name,
      currentLevel,
      levelResults: {
        app_store: appStore,
        enterprise: enterprise,
        regulated: regulated,
      },
      summary: this.generateSummary(currentLevel, appStore, enterprise, regulated),
    };
  }

  private generateSummary(
    currentLevel: ComplianceLevel | null,
    appStore: ComplianceCheckResult,
    enterprise: ComplianceCheckResult,
    regulated: ComplianceCheckResult
  ): string {
    if (!currentLevel) {
      return `This AI does not meet minimum compliance requirements. ${appStore.violations.length} violations found for App Store compliance.`;
    }

    const summaries: Record<ComplianceLevel, string> = {
      custom: 'This AI meets basic compliance requirements only.',
      app_store: 'This AI is suitable for App Store / Play Store distribution.',
      enterprise: 'This AI meets enterprise compliance requirements with full audit support.',
      regulated: 'This AI meets requirements for regulated industries (healthcare, finance, legal).',
    };

    return summaries[currentLevel];
  }
}

export interface ComplianceReport {
  /** Report generation timestamp */
  generatedAt: Date;

  /** AI Object ID */
  aiObjectId: string;

  /** AI Object name */
  aiObjectName: string;

  /** Current compliance level */
  currentLevel: ComplianceLevel | null;

  /** Results for each level */
  levelResults: Record<ComplianceLevel, ComplianceCheckResult>;

  /** Human-readable summary */
  summary: string;
}

// ============================================================================
// RUNTIME SAFETY
// ============================================================================

export interface SafetyInterceptResult {
  /** Whether the input was flagged */
  flagged: boolean;

  /** Category of flag */
  category?: HardStopCategory;

  /** Action taken */
  action: 'allow' | 'warn' | 'block';

  /** Message (if any) */
  message?: string;

  /** Audit log entry */
  auditEntry?: SafetyAuditEntry;
}

export interface SafetyAuditEntry {
  /** Timestamp */
  timestamp: Date;

  /** Category */
  category: HardStopCategory;

  /** Severity */
  severity: 'low' | 'medium' | 'high' | 'critical';

  /** Input hash (for privacy) */
  inputHash: string;

  /** Action taken */
  action: 'allow' | 'warn' | 'block';

  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Runtime safety interceptor
 */
export function createSafetyInterceptor(
  profile: ComplianceProfile
): RuntimeInterceptor {
  return {
    id: `compliance_${profile.id}`,
    check: (input: string): InterceptorResult => {
      // This is a simplified check - production would use ML classifiers
      const lowerInput = input.toLowerCase();

      // Check content restrictions
      for (const restriction of profile.contentRestrictions) {
        for (const restricted of restriction.restricted) {
          if (lowerInput.includes(restricted.toLowerCase())) {
            return {
              triggered: true,
              severity: restriction.enforcement === 'block' ? 'block' : 'warn',
              message: restriction.reason,
              continueProcessing: restriction.enforcement !== 'block',
            };
          }
        }
      }

      return {
        triggered: false,
        continueProcessing: true,
      };
    },
  };
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let complianceEngineInstance: ComplianceEngine | null = null;

export function getComplianceEngine(): ComplianceEngine {
  if (!complianceEngineInstance) {
    complianceEngineInstance = new ComplianceEngine();
  }
  return complianceEngineInstance;
}
