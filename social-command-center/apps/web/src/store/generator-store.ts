import { create } from 'zustand';
import type { SlidePlan, CarouselPlan, GeneratedSlide, VideoPlan, GeneratedVideo, VideoPlatform, GeneratedSpeech } from '../services/api';

export type ContentType = 'carousel' | 'quote-card' | 'mixed-media' | 'educational' | 'video-clip' | 'script-to-speech' | 'video-editor';
export type GeneratorStep = 'configure' | 'review' | 'preview';

export interface EditorClip {
  id: string;
  fileName: string;
  duration: number;
  storageKey: string | null;
  startTime: number;
  endTime: number;
  status: 'uploading' | 'ready' | 'error';
}

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
  videoTotalDuration: number;
  videoSourceMode: 'text' | 'image';
  videoSourceImageUrl: string | null;
  videoAudioMusic: boolean;
  videoAudioVoiceover: boolean;
  videoVoiceId: string;
  videoMusicStyle: string;
  videoEnableCaptions: boolean;
  videoCustomScriptMode: boolean;
  videoCustomScript: string;
  videoPlan: VideoPlan | null;
  generatedVideo: GeneratedVideo | null;
  isGeneratingVideo: boolean;
  videoJobId: string | null;

  // ─── Speech-specific state ────────────────────────────
  speechScript: string;
  speechVoiceId: string;
  generatedSpeech: GeneratedSpeech | null;
  isGeneratingSpeech: boolean;

  // ─── Video Editor state ───────────────────────────────
  editorClips: EditorClip[];
  editorAudioSource: 'none' | 'speech' | 'upload' | 'music' | 'voiceover';
  editorAudioStorageKey: string | null;
  editorAudioFileName: string | null;
  editorAudioVolume: number;
  editorMusicStyle: string;
  editorVoiceoverScript: string;
  editorVoiceoverVoice: string;
  editorExportJobId: string | null;
  editorExportedVideo: GeneratedVideo | null;
  isExporting: boolean;

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
  setVideoTotalDuration: (duration: number) => void;
  setVideoSourceMode: (mode: 'text' | 'image') => void;
  setVideoSourceImageUrl: (url: string | null) => void;
  setVideoAudioMusic: (v: boolean) => void;
  setVideoAudioVoiceover: (v: boolean) => void;
  setVideoVoiceId: (voiceId: string) => void;
  setVideoMusicStyle: (style: string) => void;
  setVideoEnableCaptions: (v: boolean) => void;
  setVideoCustomScriptMode: (v: boolean) => void;
  setVideoCustomScript: (script: string) => void;
  setVideoPlan: (plan: VideoPlan) => void;
  setGeneratedVideo: (video: GeneratedVideo) => void;
  setIsGeneratingVideo: (v: boolean) => void;
  setVideoJobId: (jobId: string | null) => void;

  // Speech actions
  setSpeechScript: (script: string) => void;
  setSpeechVoiceId: (voiceId: string) => void;
  setGeneratedSpeech: (speech: GeneratedSpeech | null) => void;
  setIsGeneratingSpeech: (v: boolean) => void;

  // Video editor actions
  addEditorClip: (clip: EditorClip) => void;
  removeEditorClip: (id: string) => void;
  reorderEditorClips: (fromIndex: number, toIndex: number) => void;
  updateEditorClip: (id: string, updates: Partial<EditorClip>) => void;
  setEditorAudioSource: (source: 'none' | 'speech' | 'upload' | 'music' | 'voiceover') => void;
  setEditorAudioStorageKey: (key: string | null) => void;
  setEditorAudioFileName: (name: string | null) => void;
  setEditorAudioVolume: (volume: number) => void;
  setEditorMusicStyle: (style: string) => void;
  setEditorVoiceoverScript: (script: string) => void;
  setEditorVoiceoverVoice: (voice: string) => void;
  setEditorExportJobId: (jobId: string | null) => void;
  setEditorExportedVideo: (video: GeneratedVideo | null) => void;
  setIsExporting: (v: boolean) => void;

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
  videoTotalDuration: 6,
  videoSourceMode: 'text' as 'text' | 'image',
  videoSourceImageUrl: null as string | null,
  videoAudioMusic: false,
  videoAudioVoiceover: false,
  videoVoiceId: 'Deep_Voice_Man',
  videoMusicStyle: '',
  videoEnableCaptions: false,
  videoCustomScriptMode: false,
  videoCustomScript: '',
  videoPlan: null as VideoPlan | null,
  generatedVideo: null as GeneratedVideo | null,
  isGeneratingVideo: false,
  videoJobId: null as string | null,

  // Speech
  speechScript: '',
  speechVoiceId: 'Deep_Voice_Man',
  generatedSpeech: null as GeneratedSpeech | null,
  isGeneratingSpeech: false,

  // Video Editor
  editorClips: [] as EditorClip[],
  editorAudioSource: 'none' as 'none' | 'speech' | 'upload' | 'music' | 'voiceover',
  editorAudioStorageKey: null as string | null,
  editorAudioFileName: null as string | null,
  editorAudioVolume: 100,
  editorMusicStyle: '',
  editorVoiceoverScript: '',
  editorVoiceoverVoice: 'Deep_Voice_Man',
  editorExportJobId: null as string | null,
  editorExportedVideo: null as GeneratedVideo | null,
  isExporting: false,

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
  setVideoTotalDuration: (videoTotalDuration) => set({ videoTotalDuration }),
  setVideoSourceMode: (videoSourceMode) => set({ videoSourceMode }),
  setVideoSourceImageUrl: (videoSourceImageUrl) => set({ videoSourceImageUrl }),
  setVideoAudioMusic: (videoAudioMusic) => set({ videoAudioMusic }),
  setVideoAudioVoiceover: (videoAudioVoiceover) => set({ videoAudioVoiceover }),
  setVideoVoiceId: (videoVoiceId) => set({ videoVoiceId }),
  setVideoMusicStyle: (videoMusicStyle) => set({ videoMusicStyle }),
  setVideoEnableCaptions: (videoEnableCaptions) => set({ videoEnableCaptions }),
  setVideoCustomScriptMode: (videoCustomScriptMode) => set({ videoCustomScriptMode }),
  setVideoCustomScript: (videoCustomScript) => set({ videoCustomScript }),
  setVideoPlan: (plan) => set({ videoPlan: plan, step: 'review' }),
  setGeneratedVideo: (video) => set({ generatedVideo: video, step: 'preview', isGeneratingVideo: false }),
  setIsGeneratingVideo: (isGeneratingVideo) => set({ isGeneratingVideo }),
  setVideoJobId: (videoJobId) => set({ videoJobId }),

  // Speech actions
  setSpeechScript: (speechScript) => set({ speechScript }),
  setSpeechVoiceId: (speechVoiceId) => set({ speechVoiceId }),
  setGeneratedSpeech: (speech) => set({ generatedSpeech: speech, step: speech ? 'preview' : 'configure', isGeneratingSpeech: false }),
  setIsGeneratingSpeech: (isGeneratingSpeech) => set({ isGeneratingSpeech }),

  // Video editor actions
  addEditorClip: (clip) => set((state) => ({ editorClips: [...state.editorClips, clip] })),
  removeEditorClip: (id) => set((state) => ({ editorClips: state.editorClips.filter((c) => c.id !== id) })),
  reorderEditorClips: (fromIndex, toIndex) =>
    set((state) => {
      const clips = [...state.editorClips];
      const [moved] = clips.splice(fromIndex, 1);
      clips.splice(toIndex, 0, moved);
      return { editorClips: clips };
    }),
  updateEditorClip: (id, updates) =>
    set((state) => ({
      editorClips: state.editorClips.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  setEditorAudioSource: (editorAudioSource) => set({ editorAudioSource }),
  setEditorAudioStorageKey: (editorAudioStorageKey) => set({ editorAudioStorageKey }),
  setEditorAudioFileName: (editorAudioFileName) => set({ editorAudioFileName }),
  setEditorAudioVolume: (editorAudioVolume) => set({ editorAudioVolume }),
  setEditorMusicStyle: (editorMusicStyle) => set({ editorMusicStyle }),
  setEditorVoiceoverScript: (editorVoiceoverScript) => set({ editorVoiceoverScript }),
  setEditorVoiceoverVoice: (editorVoiceoverVoice) => set({ editorVoiceoverVoice }),
  setEditorExportJobId: (editorExportJobId) => set({ editorExportJobId }),
  setEditorExportedVideo: (video) => set({ editorExportedVideo: video, step: video ? 'preview' : 'configure', isExporting: false }),
  setIsExporting: (isExporting) => set({ isExporting }),

  reset: () => set(initialState),
}));
