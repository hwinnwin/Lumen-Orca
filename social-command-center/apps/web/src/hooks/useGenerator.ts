import { useMutation, useQuery } from '@tanstack/react-query';
import {
  fetchGeneratorCapabilities,
  generateCarouselPlan,
  generateCarouselSlides,
  regenerateSlide,
  generateQuoteCard,
  generateVideoPlan,
  generateVideoFromPrompt,
  animateSlide,
  testVoice,
  generateSpeech,
} from '../services/api';

export function useGeneratorCapabilities() {
  return useQuery({
    queryKey: ['generator-capabilities'],
    queryFn: fetchGeneratorCapabilities,
  });
}

export function useGeneratePlan() {
  return useMutation({ mutationFn: generateCarouselPlan });
}

export function useGenerateSlides() {
  return useMutation({ mutationFn: generateCarouselSlides });
}

export function useRegenerateSlide() {
  return useMutation({ mutationFn: regenerateSlide });
}

export function useGenerateQuoteCard() {
  return useMutation({ mutationFn: generateQuoteCard });
}

// ─── Video Hooks ─────────────────────────────────────────

export function useGenerateVideoPlan() {
  return useMutation({ mutationFn: generateVideoPlan });
}

export function useGenerateVideo() {
  return useMutation({ mutationFn: generateVideoFromPrompt });
}

export function useAnimateSlide() {
  return useMutation({ mutationFn: animateSlide });
}

export function useTestVoice() {
  return useMutation({ mutationFn: testVoice });
}

// ─── Speech Hook ─────────────────────────────────────────

export function useGenerateSpeech() {
  return useMutation({ mutationFn: generateSpeech });
}

