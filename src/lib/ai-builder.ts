/**
 * AI Builder Platform — Main Export
 *
 * Re-exports all AI Builder functionality for easy frontend access.
 *
 * Usage:
 * import { buildAI, useAIBuilder, getAIBuilderStorage } from '@/lib/ai-builder';
 */

// ============================================================================
// RE-EXPORTS FROM @lumen-orca/ai-builder PACKAGE
// ============================================================================

// Core
export {
  // Builder Service
  AIBuilderService,
  buildAI,
  quickBuildAI,
  previewPrompt,
  BuildError,
  getBuilderService,
  QUICK_BUILD_CONFIGS,
  type BuilderInput,
  type BuildResult,
  type BuildWarning,
  type BuildMetadata,
  type QuickBuildPreset,
  type AdvancedBuilderOptions,

  // AI Object Model
  createAIObjectId,
  createVersionId,
  createDefaultAIObject,
  type AIObject,
  type AIObjectId,
  type VersionId,
  type UserId,
  type AIStatus,
  type AIPurpose,
  type AIPurposeCategory,
  type AIRole,
  type AIPersona,
  type AIBehavior,
  type AITone,
  type AIOutputFormat,
  type AISafety,
  type AIMemoryPolicy,
  type AIVersion,
  type StrictnessLevel,
  type EmotionalTemperature,
  type Formality,
  type Verbosity,
  type DecisionStyle,
  type AmbiguityHandling,
  type OutputStructure,
  type ContentPolicyLevel,
  type MemoryMode,

  // Prompt Stack
  compilePromptStack,
  CORE_SYSTEM_LAYER,
  compileBehaviorLayer,
  compileToneStyleLayer,
  compileTaskLayer,
  compileSessionLayer,
  compileInterceptorLayer,
  type PromptStack,
  type CompiledPrompt,
  type PromptMetadata,
  type CoreSystemLayer,
  type BehaviorLayer,
  type ToneStyleLayer,
  type TaskLayer,
  type SessionLayer,
  type InterceptorLayer,
  type RuntimeInterceptor,
  type InterceptorResult,

  // Safety & Compliance
  ComplianceEngine,
  getComplianceEngine,
  COMPLIANCE_PROFILES,
  type ComplianceLevel,
  type ComplianceProfile,
  type ComplianceCheckResult,
  type ComplianceReport,
  type ComplianceViolation,

  // Templates
  MVP_TEMPLATES,
  getTemplate,
  getAllTemplates,
  getTemplatesByCategory,
  templateToBuilderInput,
  type AITemplate,
  type TemplateId,
  type TemplateDefaults,

  // Onboarding
  ONBOARDING_STEPS,
  createInitialState,
  getStepById,
  getNextStep,
  getPreviousStep,
  validateStep,
  answersToBuilderInput,
  getProgress,
  getStepStatus,
  type OnboardingStep,
  type OnboardingStepId,
  type OnboardingQuestion,
  type OnboardingState,
  type OnboardingAnswers,
  type QuestionType,
  type QuestionConfig,

  // Monetization
  SUBSCRIPTION_PLANS,
  FREE_PLAN,
  PRO_PLAN,
  TEAM_PLAN,
  ENTERPRISE_PLAN,
  ADD_ONS,
  getPlanById,
  getPlanByTier,
  getAddOnById,
  calculateMonthlyPrice,
  calculateUsageQuotas,
  canUpgrade,
  canDowngrade,
  formatPrice,
  formatPriceWithCents,
  type SubscriptionTier,
  type SubscriptionPlan,
  type PlanFeatures,
  type PlanLimits,
  type TuningDepth,
  type AddOn,
  type UsageRecord,
  type UsageQuota,
  type Subscription,
  type SubscriptionStatus,
} from '@lumen-orca/ai-builder';

// ============================================================================
// LOCAL EXPORTS
// ============================================================================

// Storage
export {
  getAIBuilderStorage,
  getLocalAIBuilderStorage,
  LocalAIBuilderStorage,
  type StoredAIObject,
  type AIObjectListItem,
  type StorageResult,
} from './ai-builder-storage';

// React Hooks (re-export from hooks directory)
export {
  useAIBuilder,
  useAIObjects,
  useOnboarding,
  useCompliance,
  useTemplates,
  useBuilderInput,
  type UseAIBuilderOptions,
  type UseAIBuilderReturn,
  type UseAIObjectsReturn,
  type UseOnboardingReturn,
  type UseComplianceReturn,
  type UseTemplatesReturn,
  type UseBuilderInputReturn,
} from '../hooks/use-ai-builder';
