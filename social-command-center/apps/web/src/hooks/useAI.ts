import { useMutation } from '@tanstack/react-query';
import { enhanceContent, generateThread, generateVariants, brainstormPosts, generatePlatformPosts } from '../services/api';

export function useEnhanceContent() {
  return useMutation({
    mutationFn: (data: { content: string; tone: string; platforms: string[] }) =>
      enhanceContent(data),
  });
}

export function useGenerateThread() {
  return useMutation({
    mutationFn: (data: { content: string; maxTweets?: number }) => generateThread(data),
  });
}

export function useGenerateVariants() {
  return useMutation({
    mutationFn: (data: { content: string; platforms: string[]; count?: number }) =>
      generateVariants(data),
  });
}

export function useBrainstorm() {
  return useMutation({
    mutationFn: (data: { keywords: string[]; platforms: string[]; tone?: string; count?: number }) =>
      brainstormPosts(data),
  });
}

export function useGeneratePlatformPosts() {
  return useMutation({
    mutationFn: (data: { topic: string; platforms: string[]; tone?: string; context?: string }) =>
      generatePlatformPosts(data),
  });
}
