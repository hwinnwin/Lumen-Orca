import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLovableAI } from './providers/lovable-ai.ts';
import { callOpenAI } from './providers/openai.ts';
import { callAnthropic } from './providers/anthropic.ts';
import { callGoogle } from './providers/google.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LLMRequest {
  agentRole: string;
  prompt: string;
  systemPrompt?: string;
  taskId?: string;
}

interface LLMResponse {
  result: any;
  usage: {
    provider: string;
    model: string;
    tokensInput: number;
    tokensOutput: number;
    estimatedCost: number;
    latencyMs: number;
  };
}

const PROVIDER_HANDLERS: Record<string, (config: any, messages: any[]) => Promise<any>> = {
  'lovable-ai': callLovableAI,
  'openai': callOpenAI,
  'anthropic': callAnthropic,
  'google': callGoogle,
};

async function callProviderWithFallback(config: any, messages: any[], supabase: any) {
  try {
    const handler = PROVIDER_HANDLERS[config.provider];
    if (!handler) throw new Error(`Unknown provider: ${config.provider}`);
    
    const result = await handler(config, messages);
    
    // Update provider health on success
    await supabase
      .from('provider_health')
      .update({
        status: 'healthy',
        last_success_at: new Date().toISOString(),
        consecutive_failures: 0,
      })
      .eq('provider', config.provider);
    
    return { ...result, usedProvider: config.provider, usedModel: config.model };
  } catch (primaryError) {
    console.error(`Primary provider ${config.provider} failed:`, primaryError);

    // Update provider health on failure
    const { data: healthData } = await supabase
      .from('provider_health')
      .select('consecutive_failures')
      .eq('provider', config.provider)
      .single();
    
    await supabase
      .from('provider_health')
      .update({
        status: (healthData?.consecutive_failures || 0) >= 3 ? 'down' : 'degraded',
        last_failure_at: new Date().toISOString(),
        consecutive_failures: (healthData?.consecutive_failures || 0) + 1,
      })
      .eq('provider', config.provider);

    // Try fallback if configured
    if (config.fallback_provider && config.fallback_model) {
      console.log(`Attempting fallback to ${config.fallback_provider}...`);
      const fallbackHandler = PROVIDER_HANDLERS[config.fallback_provider];
      
      if (fallbackHandler) {
        try {
          const fallbackConfig = { 
            ...config, 
            provider: config.fallback_provider, 
            model: config.fallback_model 
          };
          const result = await fallbackHandler(fallbackConfig, messages);
          
          // Update fallback provider health on success
          await supabase
            .from('provider_health')
            .update({
              status: 'healthy',
              last_success_at: new Date().toISOString(),
              consecutive_failures: 0,
            })
            .eq('provider', config.fallback_provider);
          
          return { ...result, usedProvider: config.fallback_provider, usedModel: config.fallback_model };
        } catch (fallbackError) {
          console.error(`Fallback provider ${config.fallback_provider} also failed:`, fallbackError);
          throw fallbackError;
        }
      }
    }
    
    throw primaryError;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentRole, prompt, systemPrompt, taskId }: LLMRequest = await req.json();
    const startTime = Date.now();

    // Initialize Supabase client
    // Use JWT_SERVICE_ROLE_KEY (legacy JWT format) since SUPABASE_SERVICE_ROLE_KEY
    // may be the new publishable-key format which isn't compatible with supabase-js
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('JWT_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch configuration for this agent (agent-specific first, then global)
    const { data: configs, error: configError } = await supabase
      .from('llm_configurations')
      .select('*')
      .or(`agent_role.eq.${agentRole},agent_role.is.null`)
      .eq('is_active', true)
      .order('agent_role', { ascending: false, nullsFirst: false })
      .limit(1);

    if (configError) {
      console.error('Config fetch error:', configError);
      throw new Error(`Failed to fetch LLM configuration: ${configError.message}`);
    }

    if (!configs || configs.length === 0) {
      throw new Error(`No LLM configuration found for agent ${agentRole}`);
    }

    const config = configs[0];
    console.log(`[${agentRole}] Using config:`, { provider: config.provider, model: config.model });

    // Build messages array
    const messages = [
      { 
        role: 'system', 
        content: systemPrompt || `You are ${agentRole} in the Lumen multi-agent orchestration system.` 
      },
      { role: 'user', content: prompt }
    ];

    // Call provider with fallback support
    const llmData = await callProviderWithFallback(config, messages, supabase);
    const latencyMs = Date.now() - startTime;
    const tokensInput = llmData.usage?.prompt_tokens || 0;
    const tokensOutput = llmData.usage?.completion_tokens || 0;
    
    // Cost estimation (Lovable AI pricing - adjust based on actual rates)
    const estimatedCost = (tokensInput * 0.00001) + (tokensOutput * 0.00003);

    // Log usage
    const { error: logError } = await supabase
      .from('llm_usage_logs')
      .insert({
        agent_role: agentRole,
        provider: llmData.usedProvider,
        model: llmData.usedModel,
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        estimated_cost: estimatedCost,
        latency_ms: latencyMs,
        task_id: taskId,
      });

    if (logError) {
      console.error('[Usage Log] Failed to log usage:', logError);
    }

    // Update budget spend
    const { error: budgetError } = await supabase.rpc('increment_provider_spend', {
      p_provider: llmData.usedProvider,
      p_amount: estimatedCost
    });

    if (budgetError) {
      console.error('[Budget] Failed to update spend:', budgetError);
    }

    console.log(`[${agentRole}] ✅ Completed in ${latencyMs}ms | ${tokensInput + tokensOutput} tokens | $${estimatedCost.toFixed(6)}`);

    const response: LLMResponse = {
      result: llmData.choices[0].message.content,
      usage: {
        provider: llmData.usedProvider,
        model: llmData.usedModel,
        tokensInput,
        tokensOutput,
        estimatedCost,
        latencyMs,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[LLM Proxy] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
