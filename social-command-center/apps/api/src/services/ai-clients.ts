import Anthropic from '@anthropic-ai/sdk';
import Replicate from 'replicate';
import { env } from '../config/env.js';

// ─── Shared AI Client Initialization ────────────────────
// Lazy-initialized singletons for Anthropic and Replicate clients.
// Used by both image-generator.ts and video-generator.ts.

let anthropicClient: Anthropic | null = null;
export function getAI(): Anthropic {
  if (!anthropicClient) {
    if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not configured');
    anthropicClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

let replicateClient: Replicate | null = null;
export function getReplicate(): Replicate | null {
  if (!env.REPLICATE_API_TOKEN) return null;
  if (!replicateClient) {
    replicateClient = new Replicate({ auth: env.REPLICATE_API_TOKEN });
  }
  return replicateClient;
}

export const isReplicateConfigured = Boolean(env.REPLICATE_API_TOKEN);
