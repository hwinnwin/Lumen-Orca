import { create } from 'zustand';
import type { SlidePlan, CarouselPlan, GeneratedSlide } from '../services/api';

export type ContentType = 'carousel' | 'quote-card' | 'mixed-media' | 'educational';
export type GeneratorStep = 'configure' | 'review' | 'preview';

interface GeneratorState {
  // Step
  step: GeneratorStep;

  // Configuration
  contentType: ContentType;
  topic: string;
  slideCount: number;
  tone: string;

  // Plan (from Claude)
  plan: CarouselPlan | null;

  // Generated slides (with image URLs)
  slides: GeneratedSlide[] | null;
  caption: string;
  hashtags: string[];

  // Preview navigation
  currentSlide: number;

  // Loading states
  isPlanning: boolean;
  isGenerating: boolean;
  regeneratingSlide: number | null;

  // Actions
  setStep: (step: GeneratorStep) => void;
  setContentType: (type: ContentType) => void;
  setTopic: (topic: string) => void;
  setSlideCount: (count: number) => void;
  setTone: (tone: string) => void;
  setPlan: (plan: CarouselPlan) => void;
  updateSlidePlan: (slideNumber: number, updates: Partial<SlidePlan>) => void;
  setSlides: (slides: GeneratedSlide[], caption: string, hashtags: string[]) => void;
  replaceSlide: (slideNumber: number, slide: GeneratedSlide) => void;
  setCurrentSlide: (index: number) => void;
  setIsPlanning: (v: boolean) => void;
  setIsGenerating: (v: boolean) => void;
  setRegeneratingSlide: (n: number | null) => void;
  reset: () => void;
}

const initialState = {
  step: 'configure' as GeneratorStep,
  contentType: 'carousel' as ContentType,
  topic: '',
  slideCount: 5,
  tone: 'professional',
  plan: null as CarouselPlan | null,
  slides: null as GeneratedSlide[] | null,
  caption: '',
  hashtags: [] as string[],
  currentSlide: 0,
  isPlanning: false,
  isGenerating: false,
  regeneratingSlide: null as number | null,
};

export const useGeneratorStore = create<GeneratorState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  setContentType: (contentType) => set({ contentType }),
  setTopic: (topic) => set({ topic }),
  setSlideCount: (slideCount) => set({ slideCount: Math.min(Math.max(slideCount, 2), 10) }),
  setTone: (tone) => set({ tone }),

  setPlan: (plan) => set({ plan, step: 'review' }),

  updateSlidePlan: (slideNumber, updates) =>
    set((state) => {
      if (!state.plan) return state;
      return {
        plan: {
          ...state.plan,
          slides: state.plan.slides.map((s) =>
            s.slideNumber === slideNumber ? { ...s, ...updates } : s,
          ),
        },
      };
    }),

  setSlides: (slides, caption, hashtags) =>
    set({ slides, caption, hashtags, step: 'preview', currentSlide: 0 }),

  replaceSlide: (slideNumber, slide) =>
    set((state) => ({
      slides: state.slides?.map((s) => (s.slideNumber === slideNumber ? slide : s)) ?? null,
    })),

  setCurrentSlide: (currentSlide) => set({ currentSlide }),
  setIsPlanning: (isPlanning) => set({ isPlanning }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setRegeneratingSlide: (regeneratingSlide) => set({ regeneratingSlide }),

  reset: () => set(initialState),
}));
