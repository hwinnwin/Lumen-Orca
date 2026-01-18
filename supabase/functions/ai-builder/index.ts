/**
 * AI Builder Platform — Edge Function API
 *
 * Handles AI object CRUD operations and prompt compilation.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// ============================================================================
// CORS HEADERS
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// REQUEST TYPES
// ============================================================================

interface BuildRequest {
  action: 'build';
  input: {
    name: string;
    purpose: string;
    purposeCategory: string;
    capabilities: string[];
    exclusions: string[];
    strictness: number;
    prohibitions: string[];
    emotionalTemperature: string;
    formality: string;
    verbosity: string;
    contentPolicy: string;
    disallowedTopics: string[];
    memoryMode: string;
    templateId?: string;
  };
}

interface QuickBuildRequest {
  action: 'quick_build';
  preset: string;
  name: string;
  purpose: string;
}

interface PreviewRequest {
  action: 'preview';
  input: BuildRequest['input'];
}

interface ComplianceRequest {
  action: 'check_compliance';
  aiObjectId: string;
  level: string;
}

interface SaveRequest {
  action: 'save';
  aiObject: Record<string, unknown>;
}

interface GetRequest {
  action: 'get';
  id: string;
}

interface ListRequest {
  action: 'list';
  status?: string;
}

interface DeleteRequest {
  action: 'delete';
  id: string;
}

type APIRequest =
  | BuildRequest
  | QuickBuildRequest
  | PreviewRequest
  | ComplianceRequest
  | SaveRequest
  | GetRequest
  | ListRequest
  | DeleteRequest;

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth user from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return errorResponse('Invalid or expired token', 401);
    }

    // Parse request body
    const body: APIRequest = await req.json();

    // Route to appropriate handler
    switch (body.action) {
      case 'build':
        return handleBuild(body, user.id);

      case 'quick_build':
        return handleQuickBuild(body, user.id);

      case 'preview':
        return handlePreview(body);

      case 'check_compliance':
        return await handleComplianceCheck(supabase, body, user.id);

      case 'save':
        return await handleSave(supabase, body, user.id);

      case 'get':
        return await handleGet(supabase, body, user.id);

      case 'list':
        return await handleList(supabase, body, user.id);

      case 'delete':
        return await handleDelete(supabase, body, user.id);

      default:
        return errorResponse('Unknown action');
    }
  } catch (err) {
    console.error('AI Builder API error:', err);
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
});

// ============================================================================
// HANDLERS
// ============================================================================

function handleBuild(req: BuildRequest, userId: string): Response {
  // Note: In production, import the actual builder service
  // For now, return a structured response

  const aiObjectId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const versionId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const aiObject = {
    id: aiObjectId,
    name: req.input.name,
    ownerId: userId,
    status: 'draft',
    purpose: {
      statement: req.input.purpose,
      category: req.input.purposeCategory,
      capabilities: req.input.capabilities,
      exclusions: req.input.exclusions,
      useCases: [],
    },
    role: {
      title: 'AI Assistant',
      description: `An AI assistant for: ${req.input.purpose}`,
      expertise: [],
      decisionStyle: 'consultative',
    },
    behavior: {
      strictness: req.input.strictness,
      prohibitions: req.input.prohibitions,
      requirements: [],
      ambiguityHandling: 'ask_first',
      scopeBoundaries: req.input.disallowedTopics.length > 0 ? [{
        type: 'topic',
        allowed: [],
        forbidden: req.input.disallowedTopics,
        outOfScopeResponse: "I'm not configured to discuss that topic.",
      }] : [],
      errorHandling: 'transparent',
    },
    tone: {
      temperature: req.input.emotionalTemperature,
      formality: req.input.formality,
      verbosity: req.input.verbosity,
      languageStyle: {
        useTechnicalTerms: false,
        useExamples: true,
        useAnalogies: false,
        sentenceStructure: 'varied',
        useStructuredFormat: true,
      },
    },
    outputFormat: {
      defaultStructure: 'conversational',
      acceptedInputs: ['text', 'question'],
      lengthPreference: {
        min: 'sentence',
        max: 'page',
        preferred: 'balanced',
      },
      formattingRules: [],
    },
    safety: {
      contentPolicy: req.input.contentPolicy,
      hardStops: [
        { category: 'real_person_impersonation', enabled: true },
        { category: 'copyrighted_character', enabled: true },
        { category: 'illegal_activity', enabled: true },
        { category: 'self_harm', enabled: true },
      ],
      softBoundaries: [],
      aiFraming: {
        alwaysIdentifyAsAI: true,
        disclaimerFrequency: 'session_start',
      },
      dependencyPrevention: {
        enabled: true,
        sensitivity: 'medium',
        interventionStyle: 'gentle_reminder',
      },
    },
    memory: {
      mode: req.input.memoryMode,
      contextWindowSize: 'standard',
      persistentMemory: {
        enabled: false,
        categories: [],
        maxItems: 100,
        retentionDays: 30,
      },
      sessionBoundary: {
        boundaryType: 'time_based',
        timeoutMinutes: 30,
        carryOver: ['preferences'],
      },
    },
    version: {
      currentVersionId: versionId,
      versionNumber: '1.0.0',
      history: [],
      isLocked: false,
    },
    createdAt: now,
    updatedAt: now,
    templateId: req.input.templateId,
  };

  // Generate a simple system prompt
  const systemPrompt = generateSystemPrompt(aiObject);

  return jsonResponse({
    success: true,
    aiObject,
    compiledPrompt: {
      systemPrompt,
      metadata: {
        aiObjectId,
        versionNumber: '1.0.0',
        compiledAt: now,
        estimatedTokens: Math.ceil(systemPrompt.length / 4),
      },
    },
    warnings: [],
  });
}

function handleQuickBuild(req: QuickBuildRequest, userId: string): Response {
  const presetConfigs: Record<string, Partial<BuildRequest['input']>> = {
    professional_assistant: {
      formality: 'professional',
      emotionalTemperature: 'neutral',
      verbosity: 'standard',
      strictness: 3,
      contentPolicy: 'standard',
      memoryMode: 'session',
    },
    friendly_helper: {
      formality: 'casual',
      emotionalTemperature: 'warm',
      verbosity: 'standard',
      strictness: 2,
      contentPolicy: 'standard',
      memoryMode: 'session',
    },
    strict_analyst: {
      formality: 'formal',
      emotionalTemperature: 'cold',
      verbosity: 'detailed',
      strictness: 5,
      contentPolicy: 'strict',
      memoryMode: 'session',
    },
  };

  const preset = presetConfigs[req.preset] || presetConfigs.professional_assistant;

  const buildReq: BuildRequest = {
    action: 'build',
    input: {
      name: req.name,
      purpose: req.purpose,
      purposeCategory: 'custom',
      capabilities: [],
      exclusions: [],
      prohibitions: [],
      disallowedTopics: [],
      ...preset,
      strictness: preset.strictness || 3,
      emotionalTemperature: preset.emotionalTemperature || 'neutral',
      formality: preset.formality || 'balanced',
      verbosity: preset.verbosity || 'standard',
      contentPolicy: preset.contentPolicy || 'standard',
      memoryMode: preset.memoryMode || 'session',
    },
  };

  return handleBuild(buildReq, userId);
}

function handlePreview(req: PreviewRequest): Response {
  const mockAiObject = {
    purpose: { statement: req.input.purpose },
    role: { title: 'AI Assistant', description: req.input.purpose },
    behavior: { strictness: req.input.strictness },
    tone: {
      temperature: req.input.emotionalTemperature,
      formality: req.input.formality,
      verbosity: req.input.verbosity,
    },
  };

  const systemPrompt = generateSystemPrompt(mockAiObject);

  return jsonResponse({
    success: true,
    systemPrompt,
    estimatedTokens: Math.ceil(systemPrompt.length / 4),
  });
}

async function handleComplianceCheck(
  supabase: ReturnType<typeof createClient>,
  req: ComplianceRequest,
  userId: string
): Promise<Response> {
  const { data, error } = await supabase
    .from('ai_objects')
    .select('data')
    .eq('id', req.aiObjectId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return errorResponse('AI object not found', 404);
  }

  // Simple compliance check
  const aiObject = data.data;
  const violations: string[] = [];
  const warnings: string[] = [];

  if (req.level === 'app_store') {
    if (aiObject.safety?.contentPolicy === 'permissive') {
      violations.push('Content policy must be standard or strict for app store');
    }
  }

  return jsonResponse({
    success: true,
    compliant: violations.length === 0,
    violations,
    warnings,
    level: req.level,
  });
}

async function handleSave(
  supabase: ReturnType<typeof createClient>,
  req: SaveRequest,
  userId: string
): Promise<Response> {
  const aiObject = req.aiObject;

  const { data, error } = await supabase
    .from('ai_objects')
    .upsert({
      id: aiObject.id,
      user_id: userId,
      name: aiObject.name,
      data: aiObject,
      status: aiObject.status || 'draft',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse({ success: true, aiObject: data.data });
}

async function handleGet(
  supabase: ReturnType<typeof createClient>,
  req: GetRequest,
  userId: string
): Promise<Response> {
  const { data, error } = await supabase
    .from('ai_objects')
    .select('*')
    .eq('id', req.id)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return errorResponse('AI object not found', 404);
  }

  return jsonResponse({ success: true, aiObject: data.data });
}

async function handleList(
  supabase: ReturnType<typeof createClient>,
  req: ListRequest,
  userId: string
): Promise<Response> {
  let query = supabase
    .from('ai_objects')
    .select('id, name, status, data, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (req.status) {
    query = query.eq('status', req.status);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse(error.message, 500);
  }

  const items = (data || []).map((row: Record<string, unknown>) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    purposeCategory: (row.data as Record<string, unknown>)?.purpose?.category || 'custom',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return jsonResponse({ success: true, items });
}

async function handleDelete(
  supabase: ReturnType<typeof createClient>,
  req: DeleteRequest,
  userId: string
): Promise<Response> {
  const { error } = await supabase
    .from('ai_objects')
    .delete()
    .eq('id', req.id)
    .eq('user_id', userId);

  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse({ success: true });
}

// ============================================================================
// HELPERS
// ============================================================================

function generateSystemPrompt(aiObject: Record<string, unknown>): string {
  const purpose = aiObject.purpose as Record<string, unknown>;
  const role = aiObject.role as Record<string, unknown>;
  const behavior = aiObject.behavior as Record<string, unknown>;
  const tone = aiObject.tone as Record<string, unknown>;

  const sections: string[] = [];

  // Core system
  sections.push('=== SYSTEM FOUNDATION ===');
  sections.push('You are an AI assistant created through the AI Builder Platform.');
  sections.push('You operate within a governance framework that ensures safe, reliable, and ethical behavior.');
  sections.push('');

  // Safety rules
  sections.push('Core Rules:');
  sections.push('- Never impersonate real individuals.');
  sections.push('- Do not roleplay as copyrighted characters.');
  sections.push('- Never assist with illegal activities.');
  sections.push('- Always acknowledge being an AI when asked.');
  sections.push('');

  // Role
  sections.push('=== YOUR ROLE ===');
  sections.push(`You are a ${role?.title || 'AI Assistant'}. ${role?.description || ''}`);
  sections.push(`Your primary purpose: ${purpose?.statement || ''}`);
  sections.push('');

  // Behavior
  const strictness = behavior?.strictness || 3;
  sections.push('=== BEHAVIOR ===');
  if (strictness >= 4) {
    sections.push('- Strictly enforce all guidelines. Do not make exceptions.');
  } else if (strictness <= 2) {
    sections.push('- Apply guidelines flexibly based on context.');
  } else {
    sections.push('- Balance guidelines with practical flexibility.');
  }
  sections.push('');

  // Tone
  sections.push('=== COMMUNICATION STYLE ===');
  const toneDescriptors: string[] = [];
  if (tone?.temperature === 'cold') toneDescriptors.push('factual', 'neutral');
  else if (tone?.temperature === 'warm') toneDescriptors.push('approachable', 'encouraging');
  else if (tone?.temperature === 'friendly') toneDescriptors.push('warm', 'personable');
  else toneDescriptors.push('balanced', 'professional');

  if (tone?.formality === 'casual') toneDescriptors.push('conversational');
  else if (tone?.formality === 'formal') toneDescriptors.push('highly formal', 'precise');
  else if (tone?.formality === 'professional') toneDescriptors.push('business-appropriate');

  sections.push(`Communicate in a ${toneDescriptors.join(', ')} manner.`);

  return sections.join('\n');
}
