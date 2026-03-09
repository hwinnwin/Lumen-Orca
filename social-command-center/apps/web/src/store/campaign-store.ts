import { create } from 'zustand';
import type { CampaignPostOutline, CampaignGeneratedPost } from '../services/api';

export type CampaignStep = 'configure' | 'review-plan' | 'edit-posts' | 'schedule' | 'success';
export type ScheduleMode = 'all-drafts' | 'even-spacing' | 'immediate';

interface CampaignState {
  // Wizard step
  step: CampaignStep;

  // Configuration (step 1)
  topic: string;
  platforms: string[];
  tone: string;
  audience: string;
  brandGuidance: string;
  postCount: number;

  // Plan result (step 2)
  campaignTheme: string;
  contentPillars: string[];
  platformMix: Record<string, number>;
  toneSummary: string;
  outlines: CampaignPostOutline[];

  // Generated posts (step 3)
  generatedPosts: CampaignGeneratedPost[];
  selectedPostNumbers: Set<number>;
  failedBatches: number[];

  // Loading
  isPlanning: boolean;
  isGenerating: boolean;
  generationProgress: { completed: number; total: number };

  // Schedule (step 4)
  scheduleMode: ScheduleMode;
  scheduleStartDate: string;
  scheduleIntervalHours: number;

  // Success (step 5)
  queuedPostCount: number;

  // Dedup
  requestId: string;

  // Actions
  setStep: (step: CampaignStep) => void;
  setTopic: (topic: string) => void;
  setPlatforms: (platforms: string[]) => void;
  setTone: (tone: string) => void;
  setAudience: (audience: string) => void;
  setBrandGuidance: (guidance: string) => void;
  setPostCount: (count: number) => void;

  setPlanResult: (data: {
    campaignTheme: string;
    contentPillars: string[];
    platformMix: Record<string, number>;
    toneSummary: string;
    outlines: CampaignPostOutline[];
  }) => void;

  removeOutline: (postNumber: number) => void;
  updateOutlineTitle: (postNumber: number, title: string) => void;

  addGeneratedPosts: (posts: CampaignGeneratedPost[]) => void;
  updatePostContent: (postNumber: number, content: string) => void;
  togglePostSelection: (postNumber: number) => void;
  selectAllPosts: () => void;
  deselectAllPosts: () => void;
  addFailedBatch: (batchIndex: number) => void;
  clearFailedBatches: () => void;

  setIsPlanning: (v: boolean) => void;
  setIsGenerating: (v: boolean) => void;
  setGenerationProgress: (progress: { completed: number; total: number }) => void;

  setScheduleMode: (mode: ScheduleMode) => void;
  setScheduleStartDate: (date: string) => void;
  setScheduleIntervalHours: (hours: number) => void;

  setQueuedPostCount: (count: number) => void;

  reset: () => void;
}

function generateRequestId(): string {
  return crypto.randomUUID();
}

const initialState = {
  step: 'configure' as CampaignStep,
  topic: '',
  platforms: [] as string[],
  tone: 'professional',
  audience: '',
  brandGuidance: '',
  postCount: 20,

  campaignTheme: '',
  contentPillars: [] as string[],
  platformMix: {} as Record<string, number>,
  toneSummary: '',
  outlines: [] as CampaignPostOutline[],

  generatedPosts: [] as CampaignGeneratedPost[],
  selectedPostNumbers: new Set<number>(),
  failedBatches: [] as number[],

  isPlanning: false,
  isGenerating: false,
  generationProgress: { completed: 0, total: 0 },

  scheduleMode: 'all-drafts' as ScheduleMode,
  scheduleStartDate: '',
  scheduleIntervalHours: 24,

  queuedPostCount: 0,

  requestId: generateRequestId(),
};

export const useCampaignStore = create<CampaignState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  setTopic: (topic) => set({ topic }),
  setPlatforms: (platforms) => set({ platforms }),
  setTone: (tone) => set({ tone }),
  setAudience: (audience) => set({ audience }),
  setBrandGuidance: (brandGuidance) => set({ brandGuidance }),
  setPostCount: (postCount) => set({ postCount: Math.min(Math.max(postCount, 5), 30) }),

  setPlanResult: (data) =>
    set({
      campaignTheme: data.campaignTheme,
      contentPillars: data.contentPillars,
      platformMix: data.platformMix,
      toneSummary: data.toneSummary,
      outlines: data.outlines,
      step: 'review-plan',
    }),

  removeOutline: (postNumber) =>
    set((state) => ({
      outlines: state.outlines.filter((o) => o.postNumber !== postNumber),
    })),

  updateOutlineTitle: (postNumber, title) =>
    set((state) => ({
      outlines: state.outlines.map((o) =>
        o.postNumber === postNumber ? { ...o, title } : o,
      ),
    })),

  addGeneratedPosts: (posts) =>
    set((state) => {
      const existing = new Set(state.generatedPosts.map((p) => p.postNumber));
      const newPosts = posts.filter((p) => !existing.has(p.postNumber));
      const allPosts = [...state.generatedPosts, ...newPosts];
      const allSelected = new Set(state.selectedPostNumbers);
      newPosts.forEach((p) => allSelected.add(p.postNumber));
      return { generatedPosts: allPosts, selectedPostNumbers: allSelected };
    }),

  updatePostContent: (postNumber, content) =>
    set((state) => ({
      generatedPosts: state.generatedPosts.map((p) =>
        p.postNumber === postNumber ? { ...p, content, charCount: content.length } : p,
      ),
    })),

  togglePostSelection: (postNumber) =>
    set((state) => {
      const next = new Set(state.selectedPostNumbers);
      if (next.has(postNumber)) next.delete(postNumber);
      else next.add(postNumber);
      return { selectedPostNumbers: next };
    }),

  selectAllPosts: () =>
    set((state) => ({
      selectedPostNumbers: new Set(state.generatedPosts.map((p) => p.postNumber)),
    })),

  deselectAllPosts: () => set({ selectedPostNumbers: new Set() }),

  addFailedBatch: (batchIndex) =>
    set((state) => ({
      failedBatches: [...state.failedBatches, batchIndex],
    })),

  clearFailedBatches: () => set({ failedBatches: [] }),

  setIsPlanning: (isPlanning) => set({ isPlanning }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setGenerationProgress: (generationProgress) => set({ generationProgress }),

  setScheduleMode: (scheduleMode) => set({ scheduleMode }),
  setScheduleStartDate: (scheduleStartDate) => set({ scheduleStartDate }),
  setScheduleIntervalHours: (scheduleIntervalHours) => set({ scheduleIntervalHours }),

  setQueuedPostCount: (queuedPostCount) => set({ queuedPostCount }),

  reset: () => set({ ...initialState, requestId: generateRequestId() }),
}));
