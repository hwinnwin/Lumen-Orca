/**
 * Shared LLM Client for Agent Standalone Use
 *
 * Provides a common interface for agents to call the LLM proxy Edge Function.
 * When agents are invoked via A0 orchestrator, A0 handles the LLM call.
 * This client is for standalone agent use (direct invocation without A0).
 */

export interface LLMCallOptions {
  systemPrompt: string;
  userPrompt: string;
  agentRole: string;
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
 * Call the LLM proxy Edge Function directly.
 * Used for standalone agent invocations outside of A0 orchestrator.
 */
export async function callLLM(options: LLMCallOptions): Promise<LLMResponse> {
  const { supabase } = await import('../../../src/integrations/supabase/client');

  const { data, error } = await supabase.functions.invoke('llm-proxy', {
    body: {
      agentRole: options.agentRole,
      prompt: options.userPrompt,
      systemPrompt: options.systemPrompt,
      taskId: options.taskId || `standalone-${Date.now()}`,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
    },
  });

  if (error) {
    throw new Error(`LLM call failed for ${options.agentRole}: ${error.message}`);
  }

  return data as LLMResponse;
}

/**
 * Parse JSON from LLM response, handling markdown code blocks and edge cases.
 */
export function parseJSONResponse<T = Record<string, unknown>>(raw: string): T {
  // Try direct parse first
  try {
    return JSON.parse(raw);
  } catch {
    // Ignore
  }

  // Try markdown code block extraction
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // Ignore
    }
  }

  // Try to find the largest JSON object in the response
  const braceStart = raw.indexOf('{');
  const braceEnd = raw.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    try {
      return JSON.parse(raw.slice(braceStart, braceEnd + 1));
    } catch {
      // Ignore
    }
  }

  // Try bracket for arrays
  const bracketStart = raw.indexOf('[');
  const bracketEnd = raw.lastIndexOf(']');
  if (bracketStart !== -1 && bracketEnd > bracketStart) {
    try {
      return JSON.parse(raw.slice(bracketStart, bracketEnd + 1));
    } catch {
      // Ignore
    }
  }

  throw new Error(`Failed to parse JSON from LLM response: ${raw.slice(0, 200)}...`);
}

/**
 * Validate that a parsed response contains required fields.
 */
export function validateRequiredFields(
  obj: Record<string, unknown>,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing = requiredFields.filter((field) => !(field in obj));
  return { valid: missing.length === 0, missing };
}
