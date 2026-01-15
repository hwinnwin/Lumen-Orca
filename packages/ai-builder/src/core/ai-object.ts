/**
 * AI Builder Platform — AI Object Model
 *
 * Each AI a user creates is an object, not a chat.
 * This makes AIs auditable, cloneable, and stable.
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type AIObjectId = string & { readonly __brand: 'AIObjectId' };
export type VersionId = string & { readonly __brand: 'VersionId' };
export type UserId = string & { readonly __brand: 'UserId' };

export type AIStatus = 'draft' | 'active' | 'locked' | 'archived';

export type StrictnessLevel = 1 | 2 | 3 | 4 | 5;

export type EmotionalTemperature = 'cold' | 'neutral' | 'warm' | 'friendly';

export type Formality = 'casual' | 'balanced' | 'professional' | 'formal';

export type Verbosity = 'minimal' | 'concise' | 'standard' | 'detailed' | 'comprehensive';

// ============================================================================
// AI OBJECT MODEL (CRITICAL)
// ============================================================================

/**
 * Core AI Object — The fundamental unit of the platform
 *
 * Each AI object contains everything needed to produce
 * consistent, auditable, controllable behavior.
 */
export interface AIObject {
  /** Unique identifier */
  readonly id: AIObjectId;

  /** Human-readable name */
  name: string;

  /** Owner of this AI object */
  ownerId: UserId;

  /** Current status */
  status: AIStatus;

  /** Purpose definition */
  purpose: AIPurpose;

  /** Role definition */
  role: AIRole;

  /** Behavioral constraints */
  behavior: AIBehavior;

  /** Tone and style profile */
  tone: AITone;

  /** Output formatting rules */
  outputFormat: AIOutputFormat;

  /** Safety envelope */
  safety: AISafety;

  /** Memory policy */
  memory: AIMemoryPolicy;

  /** Version control */
  version: AIVersion;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  lockedAt?: Date;

  /** Template this was derived from (if any) */
  templateId?: string;

  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// PURPOSE & ROLE
// ============================================================================

export interface AIPurpose {
  /** Primary purpose statement (user-facing) */
  statement: string;

  /** Category for organization */
  category: AIPurposeCategory;

  /** What this AI helps with */
  capabilities: string[];

  /** What this AI explicitly does NOT do */
  exclusions: string[];

  /** Target use cases */
  useCases: string[];
}

export type AIPurposeCategory =
  | 'business'
  | 'productivity'
  | 'creative'
  | 'education'
  | 'coaching'
  | 'research'
  | 'companion'
  | 'custom';

export interface AIRole {
  /** Role title (e.g., "Business Analyst", "Writing Coach") */
  title: string;

  /** Role description */
  description: string;

  /** Domain expertise areas */
  expertise: string[];

  /** Decision-making style */
  decisionStyle: DecisionStyle;

  /** Persona characteristics (optional) */
  persona?: AIPersona;
}

export type DecisionStyle =
  | 'directive'      // Gives clear recommendations
  | 'consultative'   // Asks clarifying questions first
  | 'collaborative'  // Works through options together
  | 'analytical'     // Presents data-driven analysis
  | 'supportive';    // Focuses on user's stated preferences

export interface AIPersona {
  /** Background narrative (optional) */
  background?: string;

  /** Communication style traits */
  traits: string[];

  /** Important: No real-person impersonation */
  isOriginal: true;
}

// ============================================================================
// BEHAVIOR
// ============================================================================

export interface AIBehavior {
  /** How strict the AI should be (1-5) */
  strictness: StrictnessLevel;

  /** What the AI should never do */
  prohibitions: string[];

  /** Required behaviors */
  requirements: string[];

  /** How to handle ambiguous requests */
  ambiguityHandling: AmbiguityHandling;

  /** Scope boundaries */
  scopeBoundaries: ScopeBoundary[];

  /** Error handling style */
  errorHandling: ErrorHandlingStyle;
}

export type AmbiguityHandling =
  | 'ask_first'       // Always clarify before proceeding
  | 'best_effort'     // Make reasonable assumptions
  | 'refuse'          // Require explicit instruction
  | 'acknowledge';    // Proceed but note assumptions

export interface ScopeBoundary {
  /** Type of boundary */
  type: 'topic' | 'action' | 'domain';

  /** What is in scope */
  allowed: string[];

  /** What is out of scope */
  forbidden: string[];

  /** How to respond when out of scope */
  outOfScopeResponse: string;
}

export type ErrorHandlingStyle =
  | 'transparent'     // Explain what went wrong
  | 'graceful'        // Handle silently when possible
  | 'escalate'        // Flag for human review
  | 'retry';          // Attempt recovery

// ============================================================================
// TONE & STYLE
// ============================================================================

export interface AITone {
  /** Emotional temperature */
  temperature: EmotionalTemperature;

  /** Formality level */
  formality: Formality;

  /** Verbosity preference */
  verbosity: Verbosity;

  /** Language style preferences */
  languageStyle: LanguageStyle;

  /** Custom tone markers */
  customMarkers?: ToneMarker[];
}

export interface LanguageStyle {
  /** Use technical terminology when appropriate */
  useTechnicalTerms: boolean;

  /** Include examples in explanations */
  useExamples: boolean;

  /** Use analogies and metaphors */
  useAnalogies: boolean;

  /** Preferred sentence structure */
  sentenceStructure: 'simple' | 'varied' | 'complex';

  /** Use bullet points and lists */
  useStructuredFormat: boolean;
}

export interface ToneMarker {
  /** Marker name */
  name: string;

  /** When to apply this marker */
  trigger: string;

  /** How to modify tone */
  modification: string;
}

// ============================================================================
// OUTPUT FORMAT
// ============================================================================

export interface AIOutputFormat {
  /** Default output structure */
  defaultStructure: OutputStructure;

  /** Accepted input types */
  acceptedInputs: InputType[];

  /** Output length preferences */
  lengthPreference: LengthPreference;

  /** Formatting rules */
  formattingRules: FormattingRule[];
}

export type OutputStructure =
  | 'freeform'
  | 'structured'
  | 'conversational'
  | 'step_by_step'
  | 'q_and_a';

export type InputType =
  | 'text'
  | 'question'
  | 'document'
  | 'data'
  | 'code'
  | 'image_description';

export interface LengthPreference {
  /** Minimum response length hint */
  min: 'none' | 'sentence' | 'paragraph';

  /** Maximum response length hint */
  max: 'paragraph' | 'page' | 'unlimited';

  /** Preferred length for typical responses */
  preferred: 'concise' | 'balanced' | 'thorough';
}

export interface FormattingRule {
  /** Rule name */
  name: string;

  /** When to apply */
  condition: string;

  /** Format to use */
  format: string;
}

// ============================================================================
// SAFETY
// ============================================================================

export interface AISafety {
  /** Content policy level */
  contentPolicy: ContentPolicyLevel;

  /** Hard stops (non-negotiable) */
  hardStops: SafetyHardStop[];

  /** Soft boundaries (warnings) */
  softBoundaries: SafetySoftBoundary[];

  /** AI framing requirements */
  aiFraming: AIFramingConfig;

  /** Dependency prevention */
  dependencyPrevention: DependencyPreventionConfig;
}

export type ContentPolicyLevel = 'strict' | 'standard' | 'permissive';

export interface SafetyHardStop {
  /** Category of hard stop */
  category: HardStopCategory;

  /** Whether this is enabled */
  enabled: boolean;

  /** Custom message when triggered */
  message?: string;
}

export type HardStopCategory =
  | 'real_person_impersonation'
  | 'copyrighted_character'
  | 'illegal_activity'
  | 'self_harm'
  | 'violence'
  | 'discrimination'
  | 'misinformation'
  | 'privacy_violation';

export interface SafetySoftBoundary {
  /** Boundary name */
  name: string;

  /** Detection pattern */
  pattern: string;

  /** Warning message */
  warning: string;

  /** Allow override */
  allowOverride: boolean;
}

export interface AIFramingConfig {
  /** Always identify as AI */
  alwaysIdentifyAsAI: boolean;

  /** Include disclaimer frequency */
  disclaimerFrequency: 'always' | 'session_start' | 'on_request' | 'never';

  /** Custom disclaimer text */
  customDisclaimer?: string;
}

export interface DependencyPreventionConfig {
  /** Enable dependency detection */
  enabled: boolean;

  /** Detection sensitivity */
  sensitivity: 'low' | 'medium' | 'high';

  /** Intervention style */
  interventionStyle: 'redirect' | 'gentle_reminder' | 'explicit_warning';

  /** Custom intervention message */
  customMessage?: string;
}

// ============================================================================
// MEMORY POLICY
// ============================================================================

export interface AIMemoryPolicy {
  /** Memory mode */
  mode: MemoryMode;

  /** Context window size preference */
  contextWindowSize: 'minimal' | 'standard' | 'extended' | 'maximum';

  /** What to remember across sessions */
  persistentMemory: PersistentMemoryConfig;

  /** Session boundaries */
  sessionBoundary: SessionBoundaryConfig;
}

export type MemoryMode =
  | 'stateless'       // No memory between messages
  | 'session'         // Memory within session only
  | 'persistent'      // Memory across sessions
  | 'selective';      // User-controlled memory

export interface PersistentMemoryConfig {
  /** Enable persistent memory */
  enabled: boolean;

  /** What categories to remember */
  categories: MemoryCategory[];

  /** Maximum memory items */
  maxItems: number;

  /** Retention period (days, 0 = forever) */
  retentionDays: number;
}

export type MemoryCategory =
  | 'user_preferences'
  | 'conversation_history'
  | 'learned_facts'
  | 'context_notes';

export interface SessionBoundaryConfig {
  /** How sessions are defined */
  boundaryType: 'explicit' | 'time_based' | 'continuous';

  /** Timeout for time-based sessions (minutes) */
  timeoutMinutes?: number;

  /** What to carry over between sessions */
  carryOver: ('context' | 'preferences' | 'nothing')[];
}

// ============================================================================
// VERSION CONTROL
// ============================================================================

export interface AIVersion {
  /** Current version ID */
  currentVersionId: VersionId;

  /** Version number (semantic) */
  versionNumber: string;

  /** Version history */
  history: VersionHistoryEntry[];

  /** Whether this version is locked */
  isLocked: boolean;

  /** Lock reason (if locked) */
  lockReason?: string;
}

export interface VersionHistoryEntry {
  /** Version ID */
  versionId: VersionId;

  /** Version number */
  versionNumber: string;

  /** Created timestamp */
  createdAt: Date;

  /** Created by user */
  createdBy: UserId;

  /** Change summary */
  changeSummary: string;

  /** Snapshot of the AI object at this version */
  snapshot: Omit<AIObject, 'version'>;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createAIObjectId(): AIObjectId {
  return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as AIObjectId;
}

export function createVersionId(): VersionId {
  return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as VersionId;
}

export function createDefaultAIObject(
  ownerId: UserId,
  name: string,
  purpose: string
): AIObject {
  const id = createAIObjectId();
  const versionId = createVersionId();
  const now = new Date();

  return {
    id,
    name,
    ownerId,
    status: 'draft',

    purpose: {
      statement: purpose,
      category: 'custom',
      capabilities: [],
      exclusions: [],
      useCases: [],
    },

    role: {
      title: 'AI Assistant',
      description: `An AI assistant for: ${purpose}`,
      expertise: [],
      decisionStyle: 'consultative',
    },

    behavior: {
      strictness: 3,
      prohibitions: [],
      requirements: [],
      ambiguityHandling: 'ask_first',
      scopeBoundaries: [],
      errorHandling: 'transparent',
    },

    tone: {
      temperature: 'neutral',
      formality: 'balanced',
      verbosity: 'standard',
      languageStyle: {
        useTechnicalTerms: false,
        useExamples: true,
        useAnalogies: false,
        sentenceStructure: 'varied',
        useStructuredFormat: true,
      },
    },

    outputFormat: {
      defaultStructure: 'conversational',
      acceptedInputs: ['text', 'question'],
      lengthPreference: {
        min: 'sentence',
        max: 'page',
        preferred: 'balanced',
      },
      formattingRules: [],
    },

    safety: {
      contentPolicy: 'standard',
      hardStops: [
        { category: 'real_person_impersonation', enabled: true },
        { category: 'copyrighted_character', enabled: true },
        { category: 'illegal_activity', enabled: true },
        { category: 'self_harm', enabled: true },
      ],
      softBoundaries: [],
      aiFraming: {
        alwaysIdentifyAsAI: true,
        disclaimerFrequency: 'session_start',
      },
      dependencyPrevention: {
        enabled: true,
        sensitivity: 'medium',
        interventionStyle: 'gentle_reminder',
      },
    },

    memory: {
      mode: 'session',
      contextWindowSize: 'standard',
      persistentMemory: {
        enabled: false,
        categories: [],
        maxItems: 100,
        retentionDays: 30,
      },
      sessionBoundary: {
        boundaryType: 'time_based',
        timeoutMinutes: 30,
        carryOver: ['preferences'],
      },
    },

    version: {
      currentVersionId: versionId,
      versionNumber: '1.0.0',
      history: [],
      isLocked: false,
    },

    createdAt: now,
    updatedAt: now,
  };
}
