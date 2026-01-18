/**
 * AI Builder Platform — React Hooks
 *
 * Provides React integration for the AI Builder platform.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  AIBuilderService,
  buildAI,
  quickBuildAI,
  previewPrompt,
  type BuilderInput,
  type BuildResult,
  type QuickBuildPreset,
  type BuildWarning,
} from '@lumen-orca/ai-builder';
import type {
  AIObject,
  UserId,
  AIObjectId,
  StrictnessLevel,
  EmotionalTemperature,
  Formality,
  Verbosity,
  ContentPolicyLevel,
  MemoryMode,
} from '@lumen-orca/ai-builder';
import {
  getComplianceEngine,
  type ComplianceLevel,
  type ComplianceReport,
  type ComplianceCheckResult,
} from '@lumen-orca/ai-builder';
import {
  getTemplate,
  getAllTemplates,
  templateToBuilderInput,
  type AITemplate,
  type TemplateId,
} from '@lumen-orca/ai-builder';
import {
  ONBOARDING_STEPS,
  createInitialState,
  getNextStep,
  getPreviousStep,
  validateStep,
  answersToBuilderInput,
  getProgress,
  type OnboardingState,
  type OnboardingStepId,
  type OnboardingAnswers,
} from '@lumen-orca/ai-builder';

// ============================================================================
// STORAGE KEY
// ============================================================================

const STORAGE_KEY = 'lumen_ai_builder_objects';
const DRAFT_STORAGE_KEY = 'lumen_ai_builder_draft';

// ============================================================================
// useAIBuilder — Main builder hook
// ============================================================================

export interface UseAIBuilderOptions {
  userId: UserId;
  autoSaveDraft?: boolean;
}

export interface UseAIBuilderReturn {
  // Build actions
  build: (input: BuilderInput) => BuildResult;
  quickBuild: (preset: QuickBuildPreset, name: string, purpose: string) => BuildResult;
  buildFromTemplate: (templateId: TemplateId, name: string, purpose?: string) => BuildResult;
  preview: (input: BuilderInput) => string;

  // State
  lastBuildResult: BuildResult | null;
  isBuilding: boolean;
  buildError: Error | null;

  // Utilities
  estimateTokens: (input: BuilderInput) => number;
}

export function useAIBuilder(options: UseAIBuilderOptions): UseAIBuilderReturn {
  const { userId } = options;
  const [lastBuildResult, setLastBuildResult] = useState<BuildResult | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildError, setBuildError] = useState<Error | null>(null);

  const service = useMemo(() => new AIBuilderService(), []);

  const build = useCallback((input: BuilderInput): BuildResult => {
    setIsBuilding(true);
    setBuildError(null);
    try {
      const result = buildAI(input, userId);
      setLastBuildResult(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setBuildError(error);
      throw error;
    } finally {
      setIsBuilding(false);
    }
  }, [userId]);

  const quickBuild = useCallback((
    preset: QuickBuildPreset,
    name: string,
    purpose: string
  ): BuildResult => {
    setIsBuilding(true);
    setBuildError(null);
    try {
      const result = quickBuildAI(preset, name, purpose, userId);
      setLastBuildResult(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setBuildError(error);
      throw error;
    } finally {
      setIsBuilding(false);
    }
  }, [userId]);

  const buildFromTemplate = useCallback((
    templateId: TemplateId,
    name: string,
    purpose?: string
  ): BuildResult => {
    const template = getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    const input = templateToBuilderInput(template, name, purpose);
    return build(input);
  }, [build]);

  const preview = useCallback((input: BuilderInput): string => {
    return previewPrompt(input);
  }, []);

  const estimateTokens = useCallback((input: BuilderInput): number => {
    return service.estimateTokens(input);
  }, [service]);

  return {
    build,
    quickBuild,
    buildFromTemplate,
    preview,
    lastBuildResult,
    isBuilding,
    buildError,
    estimateTokens,
  };
}

// ============================================================================
// useAIObjects — AI object storage and management
// ============================================================================

export interface UseAIObjectsReturn {
  // State
  aiObjects: AIObject[];
  isLoading: boolean;

  // Actions
  saveAIObject: (ai: AIObject) => void;
  deleteAIObject: (id: AIObjectId) => void;
  getAIObject: (id: AIObjectId) => AIObject | undefined;
  updateAIObject: (id: AIObjectId, updates: Partial<AIObject>) => void;
  lockAIObject: (id: AIObjectId, reason?: string) => void;
  cloneAIObject: (id: AIObjectId, newName: string) => AIObject | undefined;

  // Utilities
  exportAIObject: (id: AIObjectId) => string | null;
  importAIObject: (json: string) => AIObject | null;
}

export function useAIObjects(): UseAIObjectsReturn {
  const [aiObjects, setAIObjects] = useState<AIObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Restore dates
        const restored = parsed.map((ai: AIObject) => ({
          ...ai,
          createdAt: new Date(ai.createdAt),
          updatedAt: new Date(ai.updatedAt),
          lockedAt: ai.lockedAt ? new Date(ai.lockedAt) : undefined,
        }));
        setAIObjects(restored);
      }
    } catch {
      console.error('Failed to load AI objects from storage');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage when aiObjects change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(aiObjects));
    }
  }, [aiObjects, isLoading]);

  const saveAIObject = useCallback((ai: AIObject) => {
    setAIObjects(prev => {
      const existing = prev.findIndex(a => a.id === ai.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = ai;
        return updated;
      }
      return [...prev, ai];
    });
  }, []);

  const deleteAIObject = useCallback((id: AIObjectId) => {
    setAIObjects(prev => prev.filter(ai => ai.id !== id));
  }, []);

  const getAIObject = useCallback((id: AIObjectId): AIObject | undefined => {
    return aiObjects.find(ai => ai.id === id);
  }, [aiObjects]);

  const updateAIObject = useCallback((id: AIObjectId, updates: Partial<AIObject>) => {
    setAIObjects(prev => prev.map(ai =>
      ai.id === id ? { ...ai, ...updates, updatedAt: new Date() } : ai
    ));
  }, []);

  const lockAIObject = useCallback((id: AIObjectId, reason?: string) => {
    setAIObjects(prev => prev.map(ai =>
      ai.id === id
        ? {
            ...ai,
            status: 'locked' as const,
            lockedAt: new Date(),
            version: {
              ...ai.version,
              isLocked: true,
              lockReason: reason,
            },
          }
        : ai
    ));
  }, []);

  const cloneAIObject = useCallback((id: AIObjectId, newName: string): AIObject | undefined => {
    const original = aiObjects.find(ai => ai.id === id);
    if (!original) return undefined;

    const cloned: AIObject = {
      ...original,
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as AIObjectId,
      name: newName,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      lockedAt: undefined,
      version: {
        currentVersionId: `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as any,
        versionNumber: '1.0.0',
        history: [],
        isLocked: false,
      },
    };

    setAIObjects(prev => [...prev, cloned]);
    return cloned;
  }, [aiObjects]);

  const exportAIObject = useCallback((id: AIObjectId): string | null => {
    const ai = aiObjects.find(a => a.id === id);
    if (!ai) return null;
    return JSON.stringify(ai, null, 2);
  }, [aiObjects]);

  const importAIObject = useCallback((json: string): AIObject | null => {
    try {
      const parsed = JSON.parse(json);
      // Generate new ID to avoid conflicts
      const imported: AIObject = {
        ...parsed,
        id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as AIObjectId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'draft',
      };
      setAIObjects(prev => [...prev, imported]);
      return imported;
    } catch {
      return null;
    }
  }, []);

  return {
    aiObjects,
    isLoading,
    saveAIObject,
    deleteAIObject,
    getAIObject,
    updateAIObject,
    lockAIObject,
    cloneAIObject,
    exportAIObject,
    importAIObject,
  };
}

// ============================================================================
// useOnboarding — Onboarding flow state management
// ============================================================================

export interface UseOnboardingReturn {
  // State
  state: OnboardingState;
  currentStep: typeof ONBOARDING_STEPS[number] | undefined;
  progress: number;

  // Navigation
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepId: OnboardingStepId) => void;

  // Answers
  setAnswer: <K extends keyof OnboardingAnswers>(
    key: K,
    value: OnboardingAnswers[K]
  ) => void;
  setAnswers: (answers: Partial<OnboardingAnswers>) => void;

  // Validation
  validateCurrentStep: () => boolean;
  errors: Record<string, string>;

  // Completion
  isComplete: boolean;
  getBuilderInput: () => BuilderInput | null;
  reset: () => void;
}

export function useOnboarding(): UseOnboardingReturn {
  const [state, setState] = useState<OnboardingState>(createInitialState);

  // Load draft from localStorage
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (draft) {
        setState(JSON.parse(draft));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Save draft to localStorage
  useEffect(() => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const currentStep = useMemo(
    () => ONBOARDING_STEPS.find(s => s.id === state.currentStep),
    [state.currentStep]
  );

  const progress = useMemo(
    () => getProgress(state.currentStep),
    [state.currentStep]
  );

  const validateCurrentStep = useCallback((): boolean => {
    const errors = validateStep(state.currentStep, state.answers as OnboardingAnswers);
    setState(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  }, [state.currentStep, state.answers]);

  const nextStep = useCallback(() => {
    if (!validateCurrentStep()) return;

    const next = getNextStep(state.currentStep);
    if (next) {
      setState(prev => ({ ...prev, currentStep: next, errors: {} }));
    } else {
      setState(prev => ({ ...prev, complete: true }));
    }
  }, [state.currentStep, validateCurrentStep]);

  const previousStep = useCallback(() => {
    const prev = getPreviousStep(state.currentStep);
    if (prev) {
      setState(s => ({ ...s, currentStep: prev, errors: {} }));
    }
  }, [state.currentStep]);

  const goToStep = useCallback((stepId: OnboardingStepId) => {
    setState(prev => ({ ...prev, currentStep: stepId, errors: {} }));
  }, []);

  const setAnswer = useCallback(<K extends keyof OnboardingAnswers>(
    key: K,
    value: OnboardingAnswers[K]
  ) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [key]: value },
    }));
  }, []);

  const setAnswers = useCallback((answers: Partial<OnboardingAnswers>) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, ...answers },
    }));
  }, []);

  const getBuilderInput = useCallback((): BuilderInput | null => {
    if (!state.complete) return null;
    return answersToBuilderInput(state.answers as OnboardingAnswers);
  }, [state.complete, state.answers]);

  const reset = useCallback(() => {
    setState(createInitialState());
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  }, []);

  return {
    state,
    currentStep,
    progress,
    nextStep,
    previousStep,
    goToStep,
    setAnswer,
    setAnswers,
    validateCurrentStep,
    errors: state.errors,
    isComplete: state.complete,
    getBuilderInput,
    reset,
  };
}

// ============================================================================
// useCompliance — Compliance checking hook
// ============================================================================

export interface UseComplianceReturn {
  checkCompliance: (ai: AIObject, level: ComplianceLevel) => ComplianceCheckResult;
  getComplianceLevel: (ai: AIObject) => ComplianceLevel | null;
  generateReport: (ai: AIObject) => ComplianceReport;
  enforceCompliance: (ai: AIObject, level: ComplianceLevel) => AIObject;
}

export function useCompliance(): UseComplianceReturn {
  const engine = useMemo(() => getComplianceEngine(), []);

  const checkCompliance = useCallback((ai: AIObject, level: ComplianceLevel) => {
    return engine.checkCompliance(ai, level);
  }, [engine]);

  const getComplianceLevel = useCallback((ai: AIObject) => {
    return engine.getComplianceLevel(ai);
  }, [engine]);

  const generateReport = useCallback((ai: AIObject) => {
    return engine.generateReport(ai);
  }, [engine]);

  const enforceCompliance = useCallback((ai: AIObject, level: ComplianceLevel) => {
    return engine.enforceCompliance(ai, level);
  }, [engine]);

  return {
    checkCompliance,
    getComplianceLevel,
    generateReport,
    enforceCompliance,
  };
}

// ============================================================================
// useTemplates — Template management hook
// ============================================================================

export interface UseTemplatesReturn {
  templates: AITemplate[];
  getTemplate: (id: TemplateId) => AITemplate | undefined;
  getTemplatesByCategory: (category: string) => AITemplate[];
  templateToInput: (template: AITemplate, name: string, purpose?: string) => BuilderInput;
}

export function useTemplates(): UseTemplatesReturn {
  const templates = useMemo(() => getAllTemplates(), []);

  const getTemplateById = useCallback((id: TemplateId) => {
    return getTemplate(id);
  }, []);

  const getTemplatesByCategory = useCallback((category: string) => {
    return templates.filter(t => t.category === category);
  }, [templates]);

  const templateToInput = useCallback((
    template: AITemplate,
    name: string,
    purpose?: string
  ) => {
    return templateToBuilderInput(template, name, purpose);
  }, []);

  return {
    templates,
    getTemplate: getTemplateById,
    getTemplatesByCategory,
    templateToInput,
  };
}

// ============================================================================
// useBuilderInput — Form state for builder input
// ============================================================================

export interface UseBuilderInputReturn {
  input: Partial<BuilderInput>;
  setField: <K extends keyof BuilderInput>(key: K, value: BuilderInput[K]) => void;
  setInput: (input: Partial<BuilderInput>) => void;
  reset: () => void;
  isValid: boolean;
  validate: () => BuildWarning[];
}

const defaultInput: Partial<BuilderInput> = {
  purposeCategory: 'custom',
  strictness: 3,
  emotionalTemperature: 'neutral',
  formality: 'balanced',
  verbosity: 'standard',
  contentPolicy: 'standard',
  memoryMode: 'session',
  capabilities: [],
  exclusions: [],
  prohibitions: [],
  disallowedTopics: [],
};

export function useBuilderInput(initialInput?: Partial<BuilderInput>): UseBuilderInputReturn {
  const [input, setInputState] = useState<Partial<BuilderInput>>({
    ...defaultInput,
    ...initialInput,
  });

  const setField = useCallback(<K extends keyof BuilderInput>(
    key: K,
    value: BuilderInput[K]
  ) => {
    setInputState(prev => ({ ...prev, [key]: value }));
  }, []);

  const setInput = useCallback((newInput: Partial<BuilderInput>) => {
    setInputState(prev => ({ ...prev, ...newInput }));
  }, []);

  const reset = useCallback(() => {
    setInputState({ ...defaultInput });
  }, []);

  const isValid = useMemo(() => {
    return !!(
      input.name &&
      input.name.length > 0 &&
      input.purpose &&
      input.purpose.length >= 10
    );
  }, [input.name, input.purpose]);

  const validate = useCallback((): BuildWarning[] => {
    const warnings: BuildWarning[] = [];

    if (!input.name) {
      warnings.push({ code: 'EMPTY_NAME', message: 'Name is required', severity: 'error' });
    }
    if (!input.purpose) {
      warnings.push({ code: 'EMPTY_PURPOSE', message: 'Purpose is required', severity: 'error' });
    } else if (input.purpose.length < 10) {
      warnings.push({ code: 'PURPOSE_TOO_SHORT', message: 'Purpose should be more detailed', severity: 'warning' });
    }

    return warnings;
  }, [input]);

  return {
    input,
    setField,
    setInput,
    reset,
    isValid,
    validate,
  };
}
