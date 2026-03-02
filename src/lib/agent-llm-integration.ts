/**
 * Agent-LLM Integration Layer
 * Provides utilities for connecting agents to LLM providers
 */

import { supabase } from '@/integrations/supabase/client';
import type { AgentRole } from '../../packages/agents/src/types';

export interface LLMRequest {
  agentRole: AgentRole;
  prompt: string;
  systemPrompt?: string;
  taskId?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  result: string;
  usage: {
    provider: string;
    model: string;
    tokensInput: number;
    tokensOutput: number;
    estimatedCost: number;
    latencyMs: number;
  };
}

/**
 * Call LLM proxy with agent context
 */
export async function callLLMProxy(request: LLMRequest): Promise<LLMResponse> {
  const { data, error } = await supabase.functions.invoke('llm-proxy', {
    body: request
  });

  if (error) {
    throw new Error(`LLM proxy error: ${error.message}`);
  }

  return data as LLMResponse;
}

/**
 * Get custom agent system prompt from registry
 */
export function getCustomAgentPrompt(role: AgentRole): string | null {
  try {
    const customAgents = localStorage.getItem('lumen_custom_agents');
    if (!customAgents) return null;

    const agents = JSON.parse(customAgents);
    const agent = agents.find((a: any) => a.role === role || a.id === role);
    return agent?.systemPrompt || null;
  } catch (error) {
    console.warn('[Agent-LLM] Failed to get custom agent prompt:', error);
    return null;
  }
}

/**
 * Get active agent profile system prompt
 */
export function getActiveProfilePrompt(): string | null {
  try {
    const activeProfileId = localStorage.getItem('lumen_active_agent_profile');
    if (!activeProfileId) return null;

    const profilesData = localStorage.getItem('lumen_agent_profiles');
    if (!profilesData) return null;

    const profiles = JSON.parse(profilesData);
    const activeProfile = profiles.find((p: any) => p.id === activeProfileId);
    return activeProfile?.systemPrompt || null;
  } catch (error) {
    console.warn('[Agent-LLM] Failed to get active profile prompt:', error);
    return null;
  }
}

/**
 * Build enhanced system prompt with agent context
 */
export function buildEnhancedSystemPrompt(
  basePrompt: string,
  role: AgentRole
): string {
  const customPrompt = getCustomAgentPrompt(role);
  const profilePrompt = getActiveProfilePrompt();

  // Priority: Custom Agent > Agent Profile > Base Prompt
  if (customPrompt) return customPrompt;
  if (profilePrompt) return profilePrompt;
  return basePrompt;
}
