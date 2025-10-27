import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentRole, prompt, systemPrompt, taskId }: LLMRequest = await req.json();
    const startTime = Date.now();

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const messages = [
      { 
        role: 'system', 
        content: systemPrompt || `You are ${agentRole} in the Lumen multi-agent orchestration system.` 
      },
      { role: 'user', content: prompt }
    ];

    console.log(`[${agentRole}] Calling Lovable AI with model: ${config.model}`);
    
    const llmResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        max_tokens: config.max_tokens || 4096,
        temperature: config.temperature || 0.7,
      }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error(`[${agentRole}] Lovable AI error:`, llmResponse.status, errorText);
      
      if (llmResponse.status === 429) {
        throw new Error('Rate limit exceeded - please try again later');
      }
      if (llmResponse.status === 402) {
        throw new Error('Payment required - please add credits to your workspace');
      }
      throw new Error(`Lovable AI error: ${llmResponse.status} - ${errorText}`);
    }

    const llmData = await llmResponse.json();
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
        provider: config.provider,
        model: config.model,
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
      p_provider: config.provider,
      p_amount: estimatedCost
    });

    if (budgetError) {
      console.error('[Budget] Failed to update spend:', budgetError);
    }

    console.log(`[${agentRole}] ✅ Completed in ${latencyMs}ms | ${tokensInput + tokensOutput} tokens | $${estimatedCost.toFixed(6)}`);

    const response: LLMResponse = {
      result: llmData.choices[0].message.content,
      usage: {
        provider: config.provider,
        model: config.model,
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
