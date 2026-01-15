/**
 * AI Builder Platform — Prompt Engineering as Infrastructure
 *
 * @packageDocumentation
 *
 * This platform lets users:
 * - Create any AI they want
 * - Without knowing how to prompt
 * - While we do the hard part: engineering reliable, safe, high-performance prompt stacks
 *
 * We sell:
 * - Predictability
 * - Control
 * - Behavior integrity
 *
 * This is infrastructure, not a novelty product.
 */

// ============================================================================
// CORE EXPORTS
// ============================================================================

// AI Object Model
export type {
  AIObject,
  AIObjectId,
  VersionId,
  UserId,
  AIStatus,
  StrictnessLevel,
  EmotionalTemperature,
  Formality,
  Verbosity,
  AIPurpose,
  AIPurposeCategory,
  AIRole,
  DecisionStyle,
  AIPersona,
  AIBehavior,
  AmbiguityHandling,
  ScopeBoundary,
  ErrorHandlingStyle,
  AITone,
  LanguageStyle,
  ToneMarker,
  AIOutputFormat,
  OutputStructure,
  InputType,
  LengthPreference,
  FormattingRule,
  AISafety,
  ContentPolicyLevel,
  SafetyHardStop,
  HardStopCategory,
  SafetySoftBoundary,
  AIFramingConfig,
  DependencyPreventionConfig,
  AIMemoryPolicy,
  MemoryMode,
  PersistentMemoryConfig,
  MemoryCategory,
  SessionBoundaryConfig,
  AIVersion,
  VersionHistoryEntry,
} from './core/ai-object';

export {
  createAIObjectId,
  createVersionId,
  createDefaultAIObject,
} from './core/ai-object';

// Prompt Stack
export type {
  PromptStack,
  CompiledPrompt,
  PromptMetadata,
  CoreSystemLayer,
  BehaviorLayer,
  ToneStyleLayer,
  TaskLayer,
  SessionLayer,
  InterceptorLayer,
  DriftDetectionConfig,
  SafetyInterceptorConfig,
  DependencyDetectionConfig,
  RuntimeInterceptor,
  InterceptorResult,
} from './core/prompt-stack';

export {
  CORE_SYSTEM_LAYER,
  compilePromptStack,
  compileBehaviorLayer,
  compileToneStyleLayer,
  compileTaskLayer,
  compileSessionLayer,
  compileInterceptorLayer,
} from './core/prompt-stack';

// Builder Service
export type {
  BuilderInput,
  AdvancedBuilderOptions,
  QuickBuildPreset,
  BuildResult,
  BuildWarning,
  BuildMetadata,
} from './core/builder-service';

export {
  AIBuilderService,
  BuildError,
  QUICK_BUILD_CONFIGS,
  getBuilderService,
  buildAI,
  quickBuildAI,
  previewPrompt,
} from './core/builder-service';

// ============================================================================
// SAFETY EXPORTS
// ============================================================================

export type {
  ComplianceLevel,
  ComplianceProfile,
  ContentRestriction,
  AuditRequirement,
  DisclosureRequirement,
  ComplianceCheckResult,
  ComplianceViolation,
  ComplianceWarning,
  ComplianceReport,
  SafetyInterceptResult,
  SafetyAuditEntry,
} from './safety/compliance-engine';

export {
  COMPLIANCE_PROFILES,
  ComplianceEngine,
  getComplianceEngine,
  createSafetyInterceptor,
} from './safety/compliance-engine';

// ============================================================================
// TEMPLATE EXPORTS
// ============================================================================

export type {
  AITemplate,
  TemplateDefaults,
} from './templates/mvp-templates';

export {
  BUSINESS_ANALYST_TEMPLATE,
  EXECUTIVE_ASSISTANT_TEMPLATE,
  CONTENT_STRATEGIST_TEMPLATE,
  COACH_TEMPLATE,
  RESEARCH_ASSISTANT_TEMPLATE,
  COMPANION_TEMPLATE,
  MVP_TEMPLATES,
  TEMPLATE_REGISTRY,
  getTemplate,
  getAllTemplates,
  getFeaturedTemplates,
  getTemplatesByCategory,
  searchTemplates,
  templateToBuilderInput,
} from './templates/mvp-templates';

// ============================================================================
// ONBOARDING EXPORTS
// ============================================================================

export type {
  OnboardingStepId,
  OnboardingStep,
  OnboardingQuestion,
  QuestionType,
  QuestionConfig,
  TextConfig,
  TextareaConfig,
  SelectConfig,
  SelectOption,
  SliderConfig,
  ToggleConfig,
  MultiSelectConfig,
  ChipInputConfig,
  QuestionCondition,
  OnboardingState,
  OnboardingAnswers,
} from './onboarding/onboarding-flow';

export {
  ONBOARDING_STEPS,
  createInitialState,
  getStepById,
  getNextStep,
  getPreviousStep,
  validateStep,
  answersToBuilderInput,
  getProgress,
  getStepStatus,
} from './onboarding/onboarding-flow';

// ============================================================================
// MONETIZATION EXPORTS
// ============================================================================

export type {
  SubscriptionTier,
  SubscriptionPlan,
  PlanFeatures,
  TuningDepth,
  MemoryFeatures,
  CollaborationFeatures,
  ComplianceFeatures,
  SupportLevel,
  PlanLimits,
  AddOn,
  UsageRecord,
  UsageQuota,
  Subscription,
  SubscriptionStatus,
  ActiveAddOn,
} from './monetization/subscription-types';

export {
  FREE_PLAN,
  PRO_PLAN,
  TEAM_PLAN,
  ENTERPRISE_PLAN,
  SUBSCRIPTION_PLANS,
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
} from './monetization/subscription-types';
