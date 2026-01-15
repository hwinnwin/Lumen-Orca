/**
 * AI Builder Platform — Onboarding Flow
 *
 * THIS IS KEY: Users do NOT write prompts.
 *
 * They answer:
 * - "What do you want this AI for?"
 * - "How strict should it be?"
 * - "What should it never do?"
 * - "How should it speak?"
 * - "Who is this not allowed to imitate?"
 *
 * Mostly sliders, toggles, and examples.
 * We translate human intent → machine rules.
 */

import type {
  AIPurposeCategory,
  StrictnessLevel,
  EmotionalTemperature,
  Formality,
  Verbosity,
  ContentPolicyLevel,
  MemoryMode,
  DecisionStyle,
} from '../core/ai-object';

import type { BuilderInput, AdvancedBuilderOptions } from '../core/builder-service';

// ============================================================================
// ONBOARDING STEP TYPES
// ============================================================================

export type OnboardingStepId =
  | 'template_selection'
  | 'basic_info'
  | 'purpose'
  | 'behavior'
  | 'tone'
  | 'safety'
  | 'review';

export interface OnboardingStep {
  /** Step identifier */
  id: OnboardingStepId;

  /** Step title */
  title: string;

  /** Step description */
  description: string;

  /** Questions in this step */
  questions: OnboardingQuestion[];

  /** Whether this step is optional */
  optional: boolean;

  /** Sort order */
  order: number;
}

export interface OnboardingQuestion {
  /** Question identifier */
  id: string;

  /** Question text (user-facing) */
  question: string;

  /** Help text */
  helpText?: string;

  /** Question type */
  type: QuestionType;

  /** Configuration for the question type */
  config: QuestionConfig;

  /** Whether this question is required */
  required: boolean;

  /** Field in BuilderInput this maps to */
  mapsTo: keyof BuilderInput | string;

  /** Conditional visibility */
  showWhen?: QuestionCondition;
}

export type QuestionType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'slider'
  | 'toggle'
  | 'multi_select'
  | 'chip_input';

export type QuestionConfig =
  | TextConfig
  | TextareaConfig
  | SelectConfig
  | SliderConfig
  | ToggleConfig
  | MultiSelectConfig
  | ChipInputConfig;

export interface TextConfig {
  type: 'text';
  placeholder: string;
  maxLength?: number;
  validation?: string; // regex
}

export interface TextareaConfig {
  type: 'textarea';
  placeholder: string;
  maxLength?: number;
  rows?: number;
}

export interface SelectConfig {
  type: 'select';
  options: SelectOption[];
  allowCustom?: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

export interface SliderConfig {
  type: 'slider';
  min: number;
  max: number;
  step: number;
  labels: Record<number, string>;
  defaultValue: number;
}

export interface ToggleConfig {
  type: 'toggle';
  labelOn: string;
  labelOff: string;
  defaultValue: boolean;
}

export interface MultiSelectConfig {
  type: 'multi_select';
  options: SelectOption[];
  maxSelections?: number;
}

export interface ChipInputConfig {
  type: 'chip_input';
  placeholder: string;
  suggestions?: string[];
  maxChips?: number;
}

export interface QuestionCondition {
  /** Question ID to check */
  questionId: string;

  /** Operator */
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';

  /** Value to compare */
  value: unknown;
}

// ============================================================================
// ONBOARDING FLOW DEFINITION
// ============================================================================

export const ONBOARDING_STEPS: OnboardingStep[] = [
  // Step 1: Template Selection
  {
    id: 'template_selection',
    title: 'Choose Your Starting Point',
    description: 'Start from a template or build from scratch',
    optional: false,
    order: 1,
    questions: [
      {
        id: 'template',
        question: 'How would you like to start?',
        type: 'select',
        required: true,
        mapsTo: 'templateId',
        config: {
          type: 'select',
          options: [
            {
              value: 'custom',
              label: 'Start from scratch',
              description: 'Build your AI from the ground up',
              icon: 'plus',
            },
            {
              value: 'business_analyst',
              label: 'Business Analyst',
              description: 'Data analysis and business insights',
              icon: 'chart-bar',
            },
            {
              value: 'executive_assistant',
              label: 'Executive Assistant',
              description: 'Administrative support and coordination',
              icon: 'briefcase',
            },
            {
              value: 'content_strategist',
              label: 'Content Strategist',
              description: 'Content planning and creation',
              icon: 'edit',
            },
            {
              value: 'coach',
              label: 'Coach / Reflective AI',
              description: 'Personal and professional development',
              icon: 'compass',
            },
            {
              value: 'research_assistant',
              label: 'Research Assistant',
              description: 'Research and knowledge synthesis',
              icon: 'search',
            },
          ],
          allowCustom: false,
        },
      },
    ],
  },

  // Step 2: Basic Info
  {
    id: 'basic_info',
    title: 'Name Your AI',
    description: 'Give your AI a name and brief description',
    optional: false,
    order: 2,
    questions: [
      {
        id: 'name',
        question: 'What should we call your AI?',
        helpText: 'This name will be shown in your dashboard',
        type: 'text',
        required: true,
        mapsTo: 'name',
        config: {
          type: 'text',
          placeholder: 'e.g., My Business Analyst',
          maxLength: 100,
        },
      },
    ],
  },

  // Step 3: Purpose
  {
    id: 'purpose',
    title: 'Define the Purpose',
    description: 'What do you want this AI for?',
    optional: false,
    order: 3,
    questions: [
      {
        id: 'purpose',
        question: 'What do you want this AI to help you with?',
        helpText: 'Be specific about the main tasks and goals',
        type: 'textarea',
        required: true,
        mapsTo: 'purpose',
        config: {
          type: 'textarea',
          placeholder: 'e.g., Help me analyze sales data, create reports, and identify business trends...',
          maxLength: 500,
          rows: 3,
        },
      },
      {
        id: 'capabilities',
        question: 'What specific things should it be able to do?',
        helpText: 'Add capabilities one at a time',
        type: 'chip_input',
        required: false,
        mapsTo: 'capabilities',
        config: {
          type: 'chip_input',
          placeholder: 'Add a capability...',
          suggestions: [
            'Analyze data',
            'Write reports',
            'Summarize documents',
            'Answer questions',
            'Provide recommendations',
            'Create outlines',
          ],
          maxChips: 10,
        },
      },
      {
        id: 'exclusions',
        question: 'What should it NOT do?',
        helpText: 'Define boundaries for your AI',
        type: 'chip_input',
        required: false,
        mapsTo: 'exclusions',
        config: {
          type: 'chip_input',
          placeholder: 'Add an exclusion...',
          suggestions: [
            'Provide financial advice',
            'Make predictions',
            'Access external systems',
            'Share personal opinions',
          ],
          maxChips: 10,
        },
      },
    ],
  },

  // Step 4: Behavior
  {
    id: 'behavior',
    title: 'Set the Behavior',
    description: 'How strict should it be?',
    optional: false,
    order: 4,
    questions: [
      {
        id: 'strictness',
        question: 'How strictly should it follow instructions?',
        helpText: 'Higher strictness means more rigid behavior',
        type: 'slider',
        required: true,
        mapsTo: 'strictness',
        config: {
          type: 'slider',
          min: 1,
          max: 5,
          step: 1,
          defaultValue: 3,
          labels: {
            1: 'Very Flexible',
            2: 'Flexible',
            3: 'Balanced',
            4: 'Strict',
            5: 'Very Strict',
          },
        },
      },
      {
        id: 'prohibitions',
        question: 'What should it absolutely never do?',
        helpText: 'Hard rules that cannot be overridden',
        type: 'chip_input',
        required: false,
        mapsTo: 'prohibitions',
        config: {
          type: 'chip_input',
          placeholder: 'Add a prohibition...',
          suggestions: [
            'Give medical advice',
            'Give legal advice',
            'Make financial predictions',
            'Share personal information',
          ],
          maxChips: 10,
        },
      },
    ],
  },

  // Step 5: Tone
  {
    id: 'tone',
    title: 'Choose the Tone',
    description: 'How should it speak?',
    optional: false,
    order: 5,
    questions: [
      {
        id: 'emotionalTemperature',
        question: 'What emotional tone should it have?',
        type: 'select',
        required: true,
        mapsTo: 'emotionalTemperature',
        config: {
          type: 'select',
          options: [
            {
              value: 'cold',
              label: 'Cold',
              description: 'Purely factual, no emotional warmth',
            },
            {
              value: 'neutral',
              label: 'Neutral',
              description: 'Balanced, professional tone',
            },
            {
              value: 'warm',
              label: 'Warm',
              description: 'Approachable and encouraging',
            },
            {
              value: 'friendly',
              label: 'Friendly',
              description: 'Personable and supportive',
            },
          ],
        },
      },
      {
        id: 'formality',
        question: 'How formal should it be?',
        type: 'select',
        required: true,
        mapsTo: 'formality',
        config: {
          type: 'select',
          options: [
            {
              value: 'casual',
              label: 'Casual',
              description: 'Relaxed, conversational style',
            },
            {
              value: 'balanced',
              label: 'Balanced',
              description: 'Appropriately formal for most contexts',
            },
            {
              value: 'professional',
              label: 'Professional',
              description: 'Business-appropriate language',
            },
            {
              value: 'formal',
              label: 'Formal',
              description: 'Highly formal, precise language',
            },
          ],
        },
      },
      {
        id: 'verbosity',
        question: 'How detailed should responses be?',
        type: 'select',
        required: true,
        mapsTo: 'verbosity',
        config: {
          type: 'select',
          options: [
            {
              value: 'minimal',
              label: 'Minimal',
              description: 'As brief as possible',
            },
            {
              value: 'concise',
              label: 'Concise',
              description: 'Short and focused',
            },
            {
              value: 'standard',
              label: 'Standard',
              description: 'Complete answers with appropriate detail',
            },
            {
              value: 'detailed',
              label: 'Detailed',
              description: 'Thorough explanations with context',
            },
            {
              value: 'comprehensive',
              label: 'Comprehensive',
              description: 'Exhaustive coverage of topics',
            },
          ],
        },
      },
    ],
  },

  // Step 6: Safety
  {
    id: 'safety',
    title: 'Configure Safety',
    description: 'Who should it not imitate? What topics should it avoid?',
    optional: false,
    order: 6,
    questions: [
      {
        id: 'contentPolicy',
        question: 'What content policy level?',
        helpText: 'Stricter policies block more potentially sensitive content',
        type: 'select',
        required: true,
        mapsTo: 'contentPolicy',
        config: {
          type: 'select',
          options: [
            {
              value: 'strict',
              label: 'Strict',
              description: 'Maximum content filtering',
            },
            {
              value: 'standard',
              label: 'Standard',
              description: 'Balanced content policy',
            },
            {
              value: 'permissive',
              label: 'Permissive',
              description: 'Minimal content filtering',
            },
          ],
        },
      },
      {
        id: 'disallowedTopics',
        question: 'What topics should it avoid discussing?',
        helpText: 'Add topics that are off-limits',
        type: 'chip_input',
        required: false,
        mapsTo: 'disallowedTopics',
        config: {
          type: 'chip_input',
          placeholder: 'Add a topic to avoid...',
          suggestions: [
            'Politics',
            'Religion',
            'Competitors',
            'Personal relationships',
          ],
          maxChips: 20,
        },
      },
      {
        id: 'noImpersonate',
        question: 'Who should it never impersonate or imitate?',
        helpText: 'Add specific people, characters, or entities',
        type: 'chip_input',
        required: false,
        mapsTo: 'advanced.noImpersonate',
        config: {
          type: 'chip_input',
          placeholder: 'Add a name or entity...',
          maxChips: 20,
        },
      },
    ],
  },

  // Step 7: Review
  {
    id: 'review',
    title: 'Review & Create',
    description: 'Review your AI configuration before creating',
    optional: false,
    order: 7,
    questions: [],
  },
];

// ============================================================================
// ONBOARDING STATE
// ============================================================================

export interface OnboardingState {
  /** Current step */
  currentStep: OnboardingStepId;

  /** Collected answers */
  answers: Partial<OnboardingAnswers>;

  /** Validation errors */
  errors: Record<string, string>;

  /** Whether onboarding is complete */
  complete: boolean;
}

export interface OnboardingAnswers {
  // Template Selection
  templateId: string | undefined;

  // Basic Info
  name: string;

  // Purpose
  purpose: string;
  capabilities: string[];
  exclusions: string[];

  // Behavior
  strictness: StrictnessLevel;
  prohibitions: string[];

  // Tone
  emotionalTemperature: EmotionalTemperature;
  formality: Formality;
  verbosity: Verbosity;

  // Safety
  contentPolicy: ContentPolicyLevel;
  disallowedTopics: string[];
  noImpersonate: string[];
}

// ============================================================================
// ONBOARDING FUNCTIONS
// ============================================================================

export function createInitialState(): OnboardingState {
  return {
    currentStep: 'template_selection',
    answers: {},
    errors: {},
    complete: false,
  };
}

export function getStepById(stepId: OnboardingStepId): OnboardingStep | undefined {
  return ONBOARDING_STEPS.find(s => s.id === stepId);
}

export function getNextStep(currentStepId: OnboardingStepId): OnboardingStepId | null {
  const currentStep = getStepById(currentStepId);
  if (!currentStep) return null;

  const nextStep = ONBOARDING_STEPS.find(s => s.order === currentStep.order + 1);
  return nextStep?.id ?? null;
}

export function getPreviousStep(currentStepId: OnboardingStepId): OnboardingStepId | null {
  const currentStep = getStepById(currentStepId);
  if (!currentStep) return null;

  const prevStep = ONBOARDING_STEPS.find(s => s.order === currentStep.order - 1);
  return prevStep?.id ?? null;
}

export function validateStep(
  stepId: OnboardingStepId,
  answers: Partial<OnboardingAnswers>
): Record<string, string> {
  const step = getStepById(stepId);
  if (!step) return {};

  const errors: Record<string, string> = {};

  for (const question of step.questions) {
    if (!question.required) continue;

    const value = getNestedValue(answers, question.mapsTo);

    if (value === undefined || value === null || value === '') {
      errors[question.id] = `${question.question} is required`;
    }

    // Type-specific validation
    if (question.config.type === 'text' && value) {
      const config = question.config as TextConfig;
      if (config.maxLength && String(value).length > config.maxLength) {
        errors[question.id] = `Maximum length is ${config.maxLength} characters`;
      }
      if (config.validation) {
        const regex = new RegExp(config.validation);
        if (!regex.test(String(value))) {
          errors[question.id] = 'Invalid format';
        }
      }
    }
  }

  return errors;
}

export function answersToBuilderInput(answers: OnboardingAnswers): BuilderInput {
  return {
    name: answers.name,
    purpose: answers.purpose,
    purposeCategory: 'custom', // Will be set from template if used
    capabilities: answers.capabilities || [],
    exclusions: answers.exclusions || [],
    strictness: answers.strictness,
    prohibitions: answers.prohibitions || [],
    emotionalTemperature: answers.emotionalTemperature,
    formality: answers.formality,
    verbosity: answers.verbosity,
    contentPolicy: answers.contentPolicy,
    disallowedTopics: answers.disallowedTopics || [],
    memoryMode: 'session',
    templateId: answers.templateId,
    advanced: {
      noImpersonate: answers.noImpersonate || [],
    },
  };
}

// Helper to get nested value from object
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

export function getProgress(currentStepId: OnboardingStepId): number {
  const currentStep = getStepById(currentStepId);
  if (!currentStep) return 0;

  const totalSteps = ONBOARDING_STEPS.length;
  return Math.round((currentStep.order / totalSteps) * 100);
}

export function getStepStatus(
  stepId: OnboardingStepId,
  currentStepId: OnboardingStepId,
  answers: Partial<OnboardingAnswers>
): 'complete' | 'current' | 'upcoming' {
  const step = getStepById(stepId);
  const currentStep = getStepById(currentStepId);

  if (!step || !currentStep) return 'upcoming';

  if (step.order < currentStep.order) {
    return 'complete';
  } else if (step.order === currentStep.order) {
    return 'current';
  } else {
    return 'upcoming';
  }
}
