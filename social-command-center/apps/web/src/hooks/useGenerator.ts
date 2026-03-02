import { useMutation, useQuery } from '@tanstack/react-query';
import {
  fetchGeneratorCapabilities,
  generateCarouselPlan,
  generateCarouselSlides,
  regenerateSlide,
  generateQuoteCard,
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
