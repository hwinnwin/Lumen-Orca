import { create } from 'zustand';
import type { SlidePlan, CarouselPlan, GeneratedSlide, VideoPlan, GeneratedVideo, VideoPlatform } from '../services/api';

export type ContentType = 'carousel' | 'quote-card' | 'mixed-media' | 'educational' | 'video-clip';
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

  // ─── Video-specific state ───────────────────────────
  videoPlatform: VideoPlatform;
  videoDuration: 6 | 10;
  videoSourceMode: 'text' | 'image';
  videoSourceImageUrl: string | null;
  videoPlan: VideoPlan | null;
  generatedVideo: GeneratedVideo | null;
  isGeneratingVideo: boolean;
  videoJobId: string | null;

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

  // Video actions
  setVideoPlatform: (platform: VideoPlatform) => void;
  setVideoDuration: (duration: 6 | 10) => void;
  setVideoSourceMode: (mode: 'text' | 'image') => void;
  setVideoSourceImageUrl: (url: string | null) => void;
  setVideoPlan: (plan: VideoPlan) => void;
  setGeneratedVideo: (video: GeneratedVideo) => void;
  setIsGeneratingVideo: (v: boolean) => void;
  setVideoJobId: (jobId: string | null) => void;

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

  // Video
  videoPlatform: 'reels' as VideoPlatform,
  videoDuration: 6 as 6 | 10,
  videoSourceMode: 'text' as 'text' | 'image',
  videoSourceImageUrl: null as string | null,
  videoPlan: null as VideoPlan | null,
  generatedVideo: null as GeneratedVideo | null,
  isGeneratingVideo: false,
  videoJobId: null as string | null,
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

  // Video actions
  setVideoPlatform: (videoPlatform) => set({ videoPlatform }),
  setVideoDuration: (videoDuration) => set({ videoDuration }),
  setVideoSourceMode: (videoSourceMode) => set({ videoSourceMode }),
  setVideoSourceImageUrl: (videoSourceImageUrl) => set({ videoSourceImageUrl }),
  setVideoPlan: (plan) => set({ videoPlan: plan, step: 'review' }),
  setGeneratedVideo: (video) => set({ generatedVideo: video, step: 'preview', isGeneratingVideo: false }),
  setIsGeneratingVideo: (isGeneratingVideo) => set({ isGeneratingVideo }),
  setVideoJobId: (videoJobId) => set({ videoJobId }),

  reset: () => set(initialState),
}));
