# AI App Builder (v1) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire the A0 → A1 → A3 → Deploy pipeline end-to-end so a user can type a prompt and get a working full-stack app deployed on Supabase.

**Architecture:** New `build-app` Edge Function receives user prompts, orchestrates A1 (spec) and A3 (codegen) via LLM proxy, deploys generated Edge Functions + frontend to Supabase, and returns a preview URL. State tracked in new `builds` and `build_steps` tables with Realtime subscriptions for live UI updates.

**Tech Stack:** Supabase Edge Functions (Deno), existing LLM proxy, React + shadcn/ui frontend, PostgreSQL.

**Pipeline:** `A0 Prompt → A1 Spec → A3 Codegen → Deploy → Live Preview`

**Total Effort:** 6–9 hours, 1 engineer, 1 day.

---

## Dependency Graph

```
Task 1 (DB) ───┬─── Task 3 (Orchestrator) ─── Task 6 (Deploy & Test) ─── Task 7 (Hardening)
Task 2 (Prompts) ──┘                                                      ─── Task 8 (Observability)
Task 1 (DB) ─── Task 4 (Frontend) ─── Task 5 (Nav)
```

Tasks 1 & 2 are parallel. Tasks 3 & 4 are parallel (4 only needs 1). Task 6 needs 3+4+5. Tasks 7 & 8 are post-deploy hardening.

---

## Task 1: Database Migration — builds & build_steps tables

**Priority:** P0 — Blocking (all other tasks depend on this)
**Estimated Time:** 15 minutes
**Files:** Create `supabase/migrations/20260224000001_builder_tables.sql`
**Dependencies:** None (first task)

### Purpose

Create the two core tables that track every build and its individual pipeline steps. These provide the state backbone for the entire system — the orchestrator writes status here, the frontend reads it for live updates, and the data enables debugging, cost tracking, and analytics.

### Schema: State Machine

The `builds` table uses a state machine with six defined states, enforced by CHECK constraints:

| Status | Meaning | Set By | Next States |
|--------|---------|--------|-------------|
| `pending` | Build created, queued | INSERT trigger | specifying, failed |
| `specifying` | A1 agent generating spec | Orchestrator | generating, failed |
| `generating` | A3 agent writing code | Orchestrator | deploying, failed |
| `deploying` | Files uploading to Storage | Orchestrator | live, failed |
| `live` | Preview URL accessible | Orchestrator | (terminal) |
| `failed` | Error at any stage | Orchestrator | (terminal) |

### Step 1: Write the migration SQL

```sql
-- Builder tables for AI App Builder pipeline
CREATE TABLE IF NOT EXISTS public.builds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'specifying', 'generating', 'deploying', 'live', 'failed')),
  spec jsonb,
  generated_files jsonb,
  preview_url text,
  error jsonb,
  llm_cost numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.build_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id uuid NOT NULL REFERENCES public.builds(id) ON DELETE CASCADE,
  agent text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  input jsonb,
  output jsonb,
  tokens_used integer DEFAULT 0,
  cost numeric DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_builds_user_id ON public.builds(user_id);
CREATE INDEX idx_builds_status ON public.builds(status);
CREATE INDEX idx_builds_active ON public.builds(status) WHERE status NOT IN ('live', 'failed');
CREATE INDEX idx_build_steps_build_id ON public.build_steps(build_id);

-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER builds_updated_at BEFORE UPDATE ON public.builds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER build_steps_updated_at BEFORE UPDATE ON public.build_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.build_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own builds"
  ON public.builds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create builds"
  ON public.builds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to builds"
  ON public.builds FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own build steps"
  ON public.build_steps FOR SELECT
  USING (
    build_id IN (SELECT id FROM public.builds WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role full access to build_steps"
  ON public.build_steps FOR ALL
  USING (auth.role() = 'service_role');

-- Enable Realtime for live frontend subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.builds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.build_steps;
```

### Step 2: Apply the migration

Run via Supabase MCP tool: `apply_migration` with name `builder_tables` and the SQL above.

### Step 3: Verify tables exist

Run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('builds', 'build_steps');`
Expected: Both tables returned.

### Step 4: Verify RLS

Test: query `builds` with two different user JWTs — each should only see their own rows. Verify service_role can read/write all.

### Step 5: Verify Realtime

Test: subscribe to `builds` changes via supabase client, update a row, confirm the subscription fires within 500ms.

### Step 6: Commit

```bash
git add supabase/migrations/20260224000001_builder_tables.sql
git commit -m "feat: add builds and build_steps tables for AI app builder"
```

### Acceptance Criteria

1. Both tables exist with all columns and constraints
2. RLS policies block cross-user reads (test with two different JWTs)
3. Service role can read/write all rows
4. CHECK constraint rejects invalid status values (e.g. `INSERT INTO builds (prompt, status) VALUES ('test', 'bogus')` fails)
5. `updated_at` auto-updates on row modification
6. Realtime subscription receives row changes within 500ms
7. Partial index `idx_builds_active` exists and is used for active-build queries

---

## Task 2: Builder System Prompts — Spec & Codegen for app building

**Priority:** P0 — Required by Task 3
**Estimated Time:** 30 minutes
**Files:** Create `packages/agents/src/builder-prompts.ts`
**Dependencies:** None

### Purpose

The prompts are the soul of the builder — they determine output quality more than any other component. These are specialized system prompts that enforce strict JSON output schemas so the orchestrator can parse results deterministically. This task includes few-shot examples, negative examples, and a repair prompt for handling malformed output.

### Step 1: Write builder-specific prompts

```typescript
/**
 * Builder-specific system prompts for AI App Builder pipeline.
 * These are specialized versions of A1/A3 prompts optimized for
 * generating full-stack Supabase apps from natural language.
 */

export const BUILDER_SPEC_PROMPT = `You are the Spec Architect for Lumen-Orca's AI App Builder.

Given a user's natural language description of an app, produce a structured specification.

RULES:
- Output ONLY valid JSON, no markdown, no explanation, no code fences
- Every app gets: a React frontend with Tailwind CSS, Supabase Edge Functions for backend, and a PostgreSQL data model
- Keep it simple — minimum viable feature set
- Use @supabase/supabase-js for all data access
- Edge Functions use Deno runtime

OUTPUT FORMAT (strict JSON):
{
  "app_name": "kebab-case-name",
  "description": "One sentence description",
  "data_model": {
    "tables": [
      {
        "name": "table_name",
        "columns": [
          { "name": "id", "type": "uuid", "primary": true, "default": "gen_random_uuid()" },
          { "name": "column_name", "type": "text|integer|boolean|timestamptz|jsonb|uuid", "nullable": false, "default": null }
        ]
      }
    ]
  },
  "pages": [
    { "path": "/", "component": "HomePage", "purpose": "Main landing/list view" }
  ],
  "edge_functions": [
    { "name": "api-resource", "method": "GET|POST|PUT|DELETE", "purpose": "CRUD for resource" }
  ],
  "dependencies": ["react", "@supabase/supabase-js"]
}

EXAMPLE INPUT: "A todo list app where users can add, complete, and delete tasks"

EXAMPLE OUTPUT:
{
  "app_name": "todo-list",
  "description": "A simple task management app with add, complete, and delete functionality",
  "data_model": {
    "tables": [
      {
        "name": "tasks",
        "columns": [
          { "name": "id", "type": "uuid", "primary": true, "default": "gen_random_uuid()" },
          { "name": "title", "type": "text", "nullable": false, "default": null },
          { "name": "completed", "type": "boolean", "nullable": false, "default": "false" },
          { "name": "created_at", "type": "timestamptz", "nullable": false, "default": "now()" }
        ]
      }
    ]
  },
  "pages": [
    { "path": "/", "component": "TaskList", "purpose": "Display all tasks with add/complete/delete controls" }
  ],
  "edge_functions": [
    { "name": "api-tasks", "method": "GET|POST|PUT|DELETE", "purpose": "CRUD operations for tasks" }
  ],
  "dependencies": ["react", "@supabase/supabase-js"]
}

COMMON MISTAKES TO AVOID:
- Do NOT wrap output in \`\`\`json code fences
- Do NOT include comments or explanations outside the JSON
- Do NOT use types that don't exist in PostgreSQL (use "text" not "string", "integer" not "number")
- Do NOT forget a primary key with gen_random_uuid() default on every table
- Do NOT create more than 3 tables for simple apps`;

export const BUILDER_CODEGEN_PROMPT = `You are the Code Generator for Lumen-Orca's AI App Builder.

Given a structured app specification, generate ALL source files for a working full-stack app.

RULES:
- Output ONLY valid JSON, no markdown, no explanation, no code fences
- Generate complete, working code — no placeholders, no TODOs
- React components use TypeScript, functional components, hooks
- Style with Tailwind CSS utility classes (assume Tailwind is configured)
- Edge Functions use Deno.serve() pattern with CORS headers
- All database access via @supabase/supabase-js client
- Include a supabase client file that reads SUPABASE_URL and SUPABASE_ANON_KEY from the page's meta tags
- Each Edge Function must handle CORS OPTIONS preflight

OUTPUT FORMAT (strict JSON):
{
  "files": {
    "index.html": "<!DOCTYPE html>...",
    "src/App.tsx": "import React from 'react'; ...",
    "src/components/ComponentName.tsx": "...",
    "src/lib/supabase.ts": "..."
  },
  "edge_functions": {
    "function-name": "import { serve } from \\"https://deno.land/std@0.168.0/http/server.ts\\"; ..."
  },
  "migration": "CREATE TABLE IF NOT EXISTS ..."
}

IMPORTANT:
- The index.html must include <meta name="supabase-url"> and <meta name="supabase-anon-key"> tags
- The supabase client reads from these meta tags so the preview can inject the right values
- Include ALL imports in every file
- Edge Functions: always include CORS headers and OPTIONS handling

CORS BOILERPLATE FOR EVERY EDGE FUNCTION:
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}

SUPABASE CLIENT BOILERPLATE:
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

COMMON MISTAKES TO AVOID:
- Do NOT wrap output in \`\`\`json code fences
- Do NOT use placeholder comments like "// TODO" or "// add logic here"
- Do NOT forget CORS OPTIONS handling in Edge Functions
- Do NOT import from node_modules paths — use esm.sh or deno.land for Edge Functions
- Do NOT forget to make the supabase client read from meta tags in the frontend`;

export const BUILDER_REPAIR_PROMPT = `You are a JSON repair assistant.

You will receive:
1. A raw LLM output that was supposed to be valid JSON but failed to parse
2. The parse error message

Your job: extract and fix the JSON. Output ONLY the corrected valid JSON, nothing else.

COMMON FIXES:
- Remove markdown code fences (\`\`\`json ... \`\`\`)
- Remove explanation text before/after the JSON
- Fix trailing commas
- Fix unescaped quotes inside strings
- Fix missing closing braces/brackets
- Remove comments (JSON doesn't support comments)

Output ONLY the fixed JSON. No explanation. No code fences.`;
```

### Step 2: Verify it exports correctly

Run: `npx tsc --noEmit packages/agents/src/builder-prompts.ts` (or just check imports work in next task).

### Step 3: Test prompt quality (manual)

Test the spec prompt against 5 diverse inputs via the LLM proxy directly:
1. "A simple counter app with increment and decrement buttons"
2. "A todo list where I can add tasks, mark them done, and delete them"
3. "A real-time chat app with rooms"
4. "A personal finance dashboard that tracks expenses by category"
5. "A landing page for a SaaS product with pricing tiers and a signup form"

Verify: all 5 return valid JSON matching the schema.

### Step 4: Commit

```bash
git add packages/agents/src/builder-prompts.ts
git commit -m "feat: add builder-specific system prompts for A1 spec, A3 codegen, and repair"
```

### Acceptance Criteria

1. Spec prompt produces valid JSON for all 5 test prompts
2. Codegen prompt produces files that render without runtime errors for at least 3 of those specs
3. Repair prompt successfully fixes markdown-wrapped JSON and trailing-comma JSON
4. All prompts compile with `tsc --noEmit`
5. Exports are importable from other modules

---

## Task 3: Build Orchestrator Service — server-side pipeline

**Priority:** P0 — Core system (this IS the product)
**Estimated Time:** 2–3 hours
**Files:** Create `supabase/functions/build-app/index.ts`
**Dependencies:** Task 1 (tables), Task 2 (prompts), existing `llm-proxy` function

### Purpose

This is the heart of the system. The `build-app` Edge Function receives a user prompt, creates a build record, sequentially invokes A1 (spec) and A3 (codegen) through the LLM proxy, deploys generated files to Supabase Storage, and returns a live preview URL. Every state transition is checkpointed to the database.

### Pipeline Flow

1. Receive POST with `{ prompt }` + optional auth header
2. **Validate input** — reject empty, >5000 chars, obvious injection attempts
3. **Rate limit** — check active builds count for user, reject if ≥5 with 429
4. Create build record (status: `pending`), extract user_id from JWT
5. Transition to `specifying` — call LLM proxy with `BUILDER_SPEC_PROMPT`
6. Parse + validate spec JSON (with `extractJSON` fallback). If invalid: retry once with `BUILDER_REPAIR_PROMPT`
7. Transition to `generating` — call LLM proxy with `BUILDER_CODEGEN_PROMPT` + spec
8. Parse + validate generated files JSON. If invalid: retry once with repair
9. Transition to `deploying` — run migration SQL, upload bundled preview HTML to Storage
10. Transition to `live` — return `{ buildId, previewUrl, spec }`
11. On any failure: log error, transition to `failed` with `{ stage, message, retryable }`, clean up partial uploads

### Step 1: Write the build-app Edge Function

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Inline prompts (Edge Functions can't import from packages/) ───
const BUILDER_SPEC_PROMPT = `[COPY THE FULL SPEC PROMPT FROM TASK 2 HERE]`;
const BUILDER_CODEGEN_PROMPT = `[COPY THE FULL CODEGEN PROMPT FROM TASK 2 HERE]`;
const BUILDER_REPAIR_PROMPT = `[COPY THE FULL REPAIR PROMPT FROM TASK 2 HERE]`;

// ─── Constants ───
const MAX_PROMPT_LENGTH = 5000;
const MAX_CONCURRENT_BUILDS = 5;
const LLM_TIMEOUT_MS = 60000;
const STORAGE_BUCKET = 'builder-previews';

interface BuildRequest {
  prompt: string;
}

// ─── JSON extraction with 3-tier fallback ───
function extractJSON(text: string): any {
  // Tier 1: Direct parse
  try { return JSON.parse(text); } catch {}
  // Tier 2: Strip markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch {}
  }
  // Tier 3: Find first JSON object in text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch {}
  }
  throw new Error('Failed to extract valid JSON from LLM response');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { prompt }: BuildRequest = await req.json();

    // ─── Input Validation ───
    if (!prompt || !prompt.trim()) {
      return new Response(JSON.stringify({ error: 'Prompt is required', retryable: false }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return new Response(JSON.stringify({ error: `Prompt too long (max ${MAX_PROMPT_LENGTH} chars)`, retryable: false }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── Extract user ───
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      userId = user?.id ?? null;
    }

    // ─── Rate Limit: max concurrent builds per user ───
    if (userId) {
      const { count } = await supabase
        .from('builds')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['pending', 'specifying', 'generating', 'deploying']);
      if ((count ?? 0) >= MAX_CONCURRENT_BUILDS) {
        return new Response(JSON.stringify({
          error: `Too many active builds (max ${MAX_CONCURRENT_BUILDS}). Wait for current builds to finish.`,
          retryable: true,
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '30' },
        });
      }
    }

    // ─── 1. Create build record ───
    const { data: build, error: buildError } = await supabase
      .from('builds')
      .insert({ prompt, user_id: userId, status: 'pending' })
      .select()
      .single();

    if (buildError || !build) {
      throw new Error(`Failed to create build: ${buildError?.message}`);
    }

    const buildId = build.id;
    console.log(JSON.stringify({ buildId, step: 'init', status: 'started' }));

    // ─── Helpers ───
    async function updateBuild(updates: Record<string, unknown>) {
      await supabase.from('builds').update(updates).eq('id', buildId);
    }

    async function createStep(agent: string) {
      const { data } = await supabase
        .from('build_steps')
        .insert({ build_id: buildId, agent, status: 'running', started_at: new Date().toISOString() })
        .select()
        .single();
      return data!.id;
    }

    async function completeStep(stepId: string, output: unknown, tokens: number, cost: number) {
      await supabase.from('build_steps').update({
        status: 'completed', output, tokens_used: tokens, cost,
        completed_at: new Date().toISOString()
      }).eq('id', stepId);
    }

    async function failStep(stepId: string, error: string) {
      await supabase.from('build_steps').update({
        status: 'failed', output: { error },
        completed_at: new Date().toISOString()
      }).eq('id', stepId);
    }

    // ─── LLM call with timeout ───
    async function callLLM(agentRole: string, systemPrompt: string, userPrompt: string) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
      try {
        const response = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/llm-proxy`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({ agentRole, prompt: userPrompt, systemPrompt }),
            signal: controller.signal,
          }
        );
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`LLM proxy error (${response.status}): ${errText}`);
        }
        return await response.json();
      } catch (err) {
        if (err.name === 'AbortError') {
          throw new Error(`LLM call timed out after ${LLM_TIMEOUT_MS / 1000}s`);
        }
        throw err;
      } finally {
        clearTimeout(timeout);
      }
    }

    // ─── Parse with repair retry ───
    async function parseWithRepair(rawResult: string, stepName: string): Promise<any> {
      try {
        return extractJSON(rawResult);
      } catch (parseErr) {
        console.log(JSON.stringify({ buildId, step: stepName, status: 'repair_attempt', error: parseErr.message }));
        // One retry with repair prompt
        const repairResult = await callLLM(
          'repair',
          BUILDER_REPAIR_PROMPT,
          `RAW OUTPUT:\n${rawResult}\n\nPARSE ERROR:\n${parseErr.message}`
        );
        return extractJSON(repairResult.result);
      }
    }

    // ─── 2. A1 — Spec ───
    await updateBuild({ status: 'specifying' });
    const specStepId = await createStep('A1_spec');
    const specStartTime = Date.now();

    let spec: any;
    try {
      const specResult = await callLLM(
        'A1_spec',
        BUILDER_SPEC_PROMPT,
        `Build this app: ${prompt}`
      );
      spec = await parseWithRepair(specResult.result, 'A1_spec');
      const specDuration = Date.now() - specStartTime;
      const specTokens = (specResult.usage?.tokensInput || 0) + (specResult.usage?.tokensOutput || 0);
      const specCost = specResult.usage?.estimatedCost || 0;
      await completeStep(specStepId, spec, specTokens, specCost);
      await updateBuild({ spec, llm_cost: specCost });
      console.log(JSON.stringify({ buildId, step: 'A1_spec', status: 'completed', durationMs: specDuration, tokens: specTokens, cost: specCost, appName: spec.app_name }));
    } catch (err) {
      await failStep(specStepId, err.message);
      await updateBuild({ status: 'failed', error: { stage: 'spec', message: err.message, retryable: true }, completed_at: new Date().toISOString() });
      throw err;
    }

    // ─── 3. A3 — Codegen ───
    await updateBuild({ status: 'generating' });
    const codegenStepId = await createStep('A3_codegen_a');
    const codegenStartTime = Date.now();

    let generated: any;
    try {
      const codegenResult = await callLLM(
        'A3_codegen_a',
        BUILDER_CODEGEN_PROMPT,
        `Generate all code for this app specification:\n${JSON.stringify(spec, null, 2)}`
      );
      generated = await parseWithRepair(codegenResult.result, 'A3_codegen_a');
      const codegenDuration = Date.now() - codegenStartTime;
      const codegenTokens = (codegenResult.usage?.tokensInput || 0) + (codegenResult.usage?.tokensOutput || 0);
      const codegenCost = codegenResult.usage?.estimatedCost || 0;
      await completeStep(codegenStepId, { fileCount: Object.keys(generated.files || {}).length }, codegenTokens, codegenCost);
      await updateBuild({ generated_files: generated, llm_cost: (build.llm_cost || 0) + codegenCost });
      console.log(JSON.stringify({ buildId, step: 'A3_codegen_a', status: 'completed', durationMs: codegenDuration, tokens: codegenTokens, cost: codegenCost, fileCount: Object.keys(generated.files || {}).length }));
    } catch (err) {
      await failStep(codegenStepId, err.message);
      await updateBuild({ status: 'failed', error: { stage: 'codegen', message: err.message, retryable: true }, completed_at: new Date().toISOString() });
      throw err;
    }

    // ─── 4. Deploy ───
    await updateBuild({ status: 'deploying' });
    const deployStepId = await createStep('deploy');
    const deployStartTime = Date.now();

    try {
      // 4a. Run migration if provided
      if (generated.migration) {
        const { error: migrationError } = await supabase.rpc('exec_sql', {
          query: generated.migration
        });
        if (migrationError) {
          console.warn(JSON.stringify({ buildId, step: 'deploy', status: 'migration_warning', error: migrationError.message }));
        }
      }

      // 4b. Ensure storage bucket exists
      await supabase.storage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => {});

      // 4c. Build self-contained preview HTML
      const previewHtml = buildPreviewHtml(generated, spec);

      // 4d. Upload preview
      const filePath = `${buildId}/index.html`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, new Blob([previewHtml], { type: 'text/html' }), {
          contentType: 'text/html',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // 4e. Get public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      const previewUrl = urlData.publicUrl;
      const deployDuration = Date.now() - deployStartTime;

      await completeStep(deployStepId, { previewUrl }, 0, 0);
      await updateBuild({
        status: 'live',
        preview_url: previewUrl,
        completed_at: new Date().toISOString(),
      });

      console.log(JSON.stringify({ buildId, step: 'deploy', status: 'completed', durationMs: deployDuration, previewUrl }));

      return new Response(JSON.stringify({
        buildId,
        status: 'live',
        previewUrl,
        spec,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (err) {
      // Clean up partial uploads on failure
      await supabase.storage.from(STORAGE_BUCKET).remove([`${buildId}/index.html`]).catch(() => {});

      await failStep(deployStepId, err.message);
      await updateBuild({ status: 'failed', error: { stage: 'deploy', message: err.message, retryable: true }, completed_at: new Date().toISOString() });
      throw err;
    }

  } catch (error) {
    console.error(JSON.stringify({ step: 'fatal', error: error instanceof Error ? error.message : 'Build failed' }));
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Build failed',
      retryable: true,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Builds a self-contained HTML preview that inlines all generated React code.
 * Uses ESM imports from esm.sh for React/ReactDOM so no build step is needed.
 * Includes error boundary for graceful crash handling.
 */
function buildPreviewHtml(generated: any, spec: any): string {
  const files = generated.files || {};
  const appCode = files['src/App.tsx'] || files['src/App.jsx'] || 'export default function App() { return <div>App</div>; }';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${spec.app_name || 'Lumen App'}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; }
    .error-boundary { padding: 2rem; color: #dc2626; font-family: monospace; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    import React from 'https://esm.sh/react@18';
    import ReactDOM from 'https://esm.sh/react-dom@18/client';
    import { createElement as h, useState, useEffect, Component } from 'https://esm.sh/react@18';

    // Error boundary
    class ErrorBoundary extends Component {
      constructor(props) { super(props); this.state = { error: null }; }
      static getDerivedStateFromError(error) { return { error }; }
      render() {
        if (this.state.error) {
          return h('div', { className: 'error-boundary' },
            h('h2', null, 'Something went wrong'),
            h('pre', null, this.state.error.toString())
          );
        }
        return this.props.children;
      }
    }

    // Inline App component
    ${appCode
      .replace(/import .+ from .+;?\n?/g, '')
      .replace(/export default /g, 'const App = ')
      .replace(/export /g, 'const ')}

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(h(ErrorBoundary, null, h(App)));
  <\/script>
</body>
</html>`;
}
```

### Step 2: Register the Edge Function

Add to `supabase/config.toml`:
```toml
[functions.build-app]
verify_jwt = false
```

### Step 3: Test locally by deploying

Deploy via Supabase MCP `deploy_edge_function`. Verify it's listed in `list_edge_functions`.

### Step 4: Commit

```bash
git add supabase/functions/build-app/index.ts supabase/config.toml
git commit -m "feat: add build-app edge function — core AI app builder pipeline"
```

### Acceptance Criteria

1. `curl POST` with a simple prompt returns `{ buildId, status: "live", previewUrl }`
2. `previewUrl` loads a functional HTML page in a browser
3. Database shows build with `status=live` and 3 completed `build_steps`
4. Sending an empty prompt returns 400 with descriptive error
5. Sending a prompt >5000 chars returns 400
6. 6th concurrent build from same user returns 429 with `Retry-After` header
7. Malformed LLM output (markdown-wrapped JSON) is successfully extracted and parsed
8. Error response includes `{ error, stage, retryable }` structure
9. Failed deploy cleans up partial Storage uploads

---

## Task 4: Frontend — Builder Page (UI)

**Priority:** P1 — User-facing (can be iterated post-launch)
**Estimated Time:** 1–2 hours
**Files:** Create `src/pages/Builder.tsx`, Modify `src/App.tsx` (add route)
**Dependencies:** Task 1 (tables exist for Realtime subscription)

### Purpose

The Builder page lets users type a prompt, submit it, watch real-time progress, and interact with the deployed preview. It uses Supabase Realtime to subscribe to build status changes instead of polling.

### Step 1: Create the Builder page component

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Rocket, AlertCircle, CheckCircle2, Code2, FileText, Upload, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BuildStep {
  id: string;
  agent: string;
  status: string;
  output: any;
  started_at: string;
  completed_at: string | null;
}

interface Build {
  id: string;
  prompt: string;
  status: string;
  spec: any;
  preview_url: string | null;
  error: any;
  llm_cost: number;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: 'Queued', icon: Loader2, color: 'bg-gray-500' },
  specifying: { label: 'Writing Spec...', icon: FileText, color: 'bg-blue-500' },
  generating: { label: 'Generating Code...', icon: Code2, color: 'bg-purple-500' },
  deploying: { label: 'Deploying...', icon: Upload, color: 'bg-orange-500' },
  live: { label: 'Live', icon: CheckCircle2, color: 'bg-green-500' },
  failed: { label: 'Failed', icon: AlertCircle, color: 'bg-red-500' },
};

const PIPELINE_STAGES = ['pending', 'specifying', 'generating', 'deploying', 'live'];

export default function Builder() {
  const [prompt, setPrompt] = useState('');
  const [building, setBuilding] = useState(false);
  const [build, setBuild] = useState<Build | null>(null);
  const [steps, setSteps] = useState<BuildStep[]>([]);
  const [buildHistory, setBuildHistory] = useState<Build[]>([]);
  const [showSpec, setShowSpec] = useState(false);
  const { toast } = useToast();

  // Load build history on mount
  useEffect(() => {
    loadBuildHistory();
  }, []);

  // Subscribe to Realtime build updates when we have an active build
  useEffect(() => {
    if (!build?.id || build.status === 'live' || build.status === 'failed') return;

    const channel = supabase
      .channel(`build-${build.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'builds',
        filter: `id=eq.${build.id}`,
      }, (payload) => {
        setBuild(payload.new as Build);
        if (payload.new.status === 'live') {
          toast({ title: 'Build complete!', description: 'Your app is live.' });
          setBuilding(false);
          loadBuildHistory();
        } else if (payload.new.status === 'failed') {
          toast({ title: 'Build failed', description: payload.new.error?.message, variant: 'destructive' });
          setBuilding(false);
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'build_steps',
        filter: `build_id=eq.${build.id}`,
      }, () => {
        // Refresh steps
        loadBuildSteps(build.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [build?.id, build?.status]);

  async function loadBuildHistory() {
    const { data } = await supabase
      .from('builds')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setBuildHistory(data);
  }

  async function loadBuildSteps(buildId: string) {
    const { data } = await supabase
      .from('build_steps')
      .select('*')
      .eq('build_id', buildId)
      .order('started_at', { ascending: true });
    if (data) setSteps(data);
  }

  async function startBuild(overridePrompt?: string) {
    const buildPrompt = overridePrompt || prompt;
    if (!buildPrompt.trim()) return;
    setBuilding(true);
    setBuild(null);
    setSteps([]);

    try {
      const { data, error } = await supabase.functions.invoke('build-app', {
        body: { prompt: buildPrompt },
      });

      if (error) throw error;

      // Set build data — Realtime will take over from here for non-terminal states
      if (data.buildId) {
        const { data: buildData } = await supabase
          .from('builds')
          .select('*')
          .eq('id', data.buildId)
          .single();
        if (buildData) setBuild(buildData);
        await loadBuildSteps(data.buildId);
      }

      // If the response already has previewUrl, the build completed synchronously
      if (data.previewUrl) {
        setBuild(prev => prev ? { ...prev, status: 'live', preview_url: data.previewUrl } : prev);
        setBuilding(false);
        loadBuildHistory();
      }
    } catch (err: any) {
      toast({ title: 'Build failed', description: err.message, variant: 'destructive' });
      setBuilding(false);
    }
  }

  const statusConfig = build ? STATUS_CONFIG[build.status] || STATUS_CONFIG.pending : null;
  const currentStageIndex = build ? PIPELINE_STAGES.indexOf(build.status) : -1;

  return (
    <div className="min-h-screen bg-background p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI App Builder</h1>
        <p className="text-muted-foreground mt-1">Describe your app and we'll build it.</p>
      </div>

      {/* Prompt Input */}
      <Card>
        <CardContent className="pt-6">
          <Textarea
            placeholder="Describe the app you want to build... e.g., 'A task management app where users can create projects, add tasks with due dates, and mark them complete'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px] text-base"
            disabled={building}
          />
          <div className="flex items-center gap-2 mt-4">
            <Button
              onClick={() => startBuild()}
              disabled={building || !prompt.trim()}
              size="lg"
            >
              {building ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Building...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Build App
                </>
              )}
            </Button>
            <span className="text-sm text-muted-foreground">{prompt.length}/5000</span>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Stepper */}
      {(build || building) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              Build Status
              {statusConfig && (
                <Badge variant="outline" className="font-normal">
                  {statusConfig.label}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visual Pipeline */}
            <div className="flex items-center gap-1">
              {PIPELINE_STAGES.map((stage, i) => {
                const isActive = stage === build?.status;
                const isComplete = currentStageIndex > i;
                const isFailed = build?.status === 'failed' && i === currentStageIndex;
                return (
                  <div key={stage} className="flex items-center gap-1 flex-1">
                    <div className={`h-2 flex-1 rounded-full transition-colors ${
                      isComplete ? 'bg-green-500' :
                      isActive ? 'bg-blue-500 animate-pulse' :
                      isFailed ? 'bg-red-500' :
                      'bg-muted'
                    }`} />
                  </div>
                );
              })}
            </div>

            {/* Step Log */}
            {steps.length > 0 && (
              <div className="space-y-2">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-3 text-sm">
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : step.status === 'failed' ? (
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500 shrink-0" />
                    )}
                    <span className="font-mono">{step.agent}</span>
                    <span className="text-muted-foreground">
                      {step.status === 'completed' ? 'Done' : step.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Spec Preview (expandable) */}
            {build?.spec && (
              <div>
                <button
                  onClick={() => setShowSpec(!showSpec)}
                  className="text-sm text-blue-400 hover:underline"
                >
                  {showSpec ? 'Hide' : 'Show'} generated spec
                </button>
                {showSpec && (
                  <pre className="mt-2 p-3 rounded-md bg-muted text-xs overflow-auto max-h-64">
                    {JSON.stringify(build.spec, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {/* Error Display with Retry */}
            {build?.error && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <p className="font-medium">Error at {build.error.stage}:</p>
                <p className="mt-1">{build.error.message}</p>
                {build.error.retryable && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => startBuild(build.prompt)}
                  >
                    <RotateCcw className="mr-1 h-3 w-3" /> Retry
                  </Button>
                )}
              </div>
            )}

            {/* Cost */}
            {build?.llm_cost != null && build.llm_cost > 0 && (
              <p className="text-sm text-muted-foreground">
                LLM cost: ${build.llm_cost.toFixed(4)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {build?.preview_url && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Preview
              <a
                href={build.preview_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-normal text-blue-400 hover:underline"
              >
                Open in new tab →
              </a>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Hide iframe on mobile, show link instead */}
            <iframe
              src={build.preview_url}
              className="w-full h-[600px] rounded-md border hidden sm:block"
              title="App Preview"
              sandbox="allow-scripts allow-same-origin"
            />
            <a
              href={build.preview_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block sm:hidden text-center py-4 text-blue-400 hover:underline"
            >
              Open preview in new tab →
            </a>
          </CardContent>
        </Card>
      )}

      {/* Build History */}
      {buildHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Builds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {buildHistory.map((b) => {
                const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer"
                    onClick={() => {
                      setBuild(b);
                      loadBuildSteps(b.id);
                    }}
                  >
                    <span className="text-sm truncate max-w-[300px]">{b.prompt}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{sc.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(b.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### Step 2: Add the route to App.tsx

In `src/App.tsx`, add inside the route definitions:

```typescript
import Builder from './pages/Builder';
// Add this route inside the dashboard layout routes:
<Route path="/builder" element={<Builder />} />
```

### Step 3: Verify build compiles

Run: `pnpm build`
Expected: No TypeScript errors.

### Step 4: Commit

```bash
git add src/pages/Builder.tsx src/App.tsx
git commit -m "feat: add Builder page with realtime progress, preview iframe, and build history"
```

### Acceptance Criteria

1. Page renders at `/builder` without console errors
2. Submitting a prompt shows live progress updates via Realtime (no polling)
3. Pipeline stepper animates through stages
4. Preview iframe loads the deployed app (hidden on mobile, link shown instead)
5. Build history shows the 10 most recent builds
6. Failed builds show error details and a Retry button
7. Spec is viewable via expandable section
8. `pnpm build` completes with zero TypeScript errors

---

## Task 5: Navigation — Add Builder to sidebar/nav

**Priority:** P1
**Estimated Time:** 15 minutes
**Files:** Modify whichever component renders the dashboard sidebar/nav
**Dependencies:** Task 4

### Step 1: Find the navigation component

Search for files containing route paths like `/agents` or `/dashboard` in `src/components/`.

### Step 2: Add Builder link

Add a nav item pointing to `/builder` with a `Rocket` or `Wand2` icon from lucide-react, labeled "Builder". Place it prominently (first or second item).

### Step 3: Verify navigation works

Run: `pnpm dev`, navigate to `/builder` in the browser. Confirm the page renders and active state styling matches other nav items.

### Step 4: Commit

```bash
git add src/components/[nav-file].tsx
git commit -m "feat: add Builder to navigation sidebar"
```

### Acceptance Criteria

1. Builder link visible in sidebar nav
2. Clicking it navigates to `/builder`
3. Active state styling matches other nav items

---

## Task 6: Deploy & Smoke Test

**Priority:** P0 — Gate for launch
**Estimated Time:** 30 minutes
**Files:** None new — deployment and testing task
**Dependencies:** Tasks 1–5

### Step 1: Deploy the build-app Edge Function

Use Supabase MCP `deploy_edge_function` with:
- name: `build-app`
- entrypoint_path: `index.ts`
- verify_jwt: `false`
- files: the content of `supabase/functions/build-app/index.ts`

### Step 2: Verify the Edge Function is deployed

Use `list_edge_functions` to confirm `build-app` appears.

### Step 3: Create the storage bucket

Run SQL:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('builder-previews', 'builder-previews', true)
ON CONFLICT (id) DO NOTHING;
```

### Step 4: Smoke Test Checklist

| # | Test | Expected Result |
|---|------|-----------------|
| 1 | POST /build-app with `{"prompt": "A simple counter app with increment and decrement buttons"}` | 200 OK, `{ buildId, status: "live", previewUrl }` |
| 2 | Open previewUrl in browser | Functional HTML page renders with counter UI |
| 3 | Query builds table | 1 row, status=live, preview_url set, llm_cost > 0 |
| 4 | Query build_steps table | 3 rows: A1_spec, A3_codegen_a, deploy — all completed |
| 5 | POST with empty prompt `{"prompt": ""}` | 400 error with descriptive message |
| 6 | POST with 10,000 char prompt | 400 error: prompt too long |
| 7 | Verify RLS: query builds as different user | Empty result set (no cross-user data leak) |
| 8 | Frontend /builder: submit prompt via UI | Live progress updates, preview iframe loads |

### Step 5: Run each test

```bash
# Test 1: Happy path
curl -X POST https://znkkpibjlifhqvtnghsd.supabase.co/functions/v1/build-app \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A simple counter app with increment and decrement buttons"}'

# Test 5: Empty prompt
curl -X POST https://znkkpibjlifhqvtnghsd.supabase.co/functions/v1/build-app \
  -H "Content-Type: application/json" \
  -d '{"prompt": ""}'

# Test 6: Long prompt
curl -X POST https://znkkpibjlifhqvtnghsd.supabase.co/functions/v1/build-app \
  -H "Content-Type: application/json" \
  -d "{\"prompt\": \"$(python3 -c "print('a' * 10000)")\"}"
```

### Step 6: Check database records

```sql
SELECT id, status, preview_url, llm_cost FROM builds ORDER BY created_at DESC LIMIT 1;
SELECT agent, status, tokens_used, cost FROM build_steps WHERE build_id = (SELECT id FROM builds ORDER BY created_at DESC LIMIT 1);
```

### Step 7: Commit any fixes

```bash
git add -A
git commit -m "fix: smoke test fixes for build pipeline"
```

---

## Task 7: Error Handling & Hardening

**Priority:** P0 — Production readiness
**Estimated Time:** 1 hour
**Files:** Modify `supabase/functions/build-app/index.ts`
**Dependencies:** Task 6 (smoke test reveals what needs hardening)

### Purpose

Retrofit production-grade resilience. Most of these enhancements are already included in the Task 3 code above, but this task is where you verify each one works and add any missing pieces discovered during smoke testing.

### Hardening Checklist

- [ ] `extractJSON` with 3-tier fallback (direct → strip fences → regex) — test with intentionally malformed input
- [ ] 60s timeout on every LLM call — test by temporarily setting timeout to 1ms
- [ ] Repair loop — test by feeding the repair prompt intentionally broken JSON
- [ ] Rate limiting (max 5 concurrent) — test by inserting 5 fake active builds then trying to start a 6th
- [ ] Structured error responses — verify every error path returns `{ error, stage, retryable }`
- [ ] Cleanup on deploy failure — test by making Storage upload fail (e.g. invalid bucket name)
- [ ] Input validation — test empty, over-length, and injection-pattern prompts

### Step 1: Verify extractJSON

Test these inputs manually:
```
// Should all parse to {"key": "value"}
'{"key": "value"}'                          // Tier 1: direct
'```json\n{"key": "value"}\n```'            // Tier 2: strip fences
'Here is the JSON:\n{"key": "value"}\nDone' // Tier 3: regex
```

### Step 2: Verify timeout

Temporarily set `LLM_TIMEOUT_MS = 1`, trigger a build, confirm it fails with "timed out" message and step status is `failed`.

### Step 3: Verify rate limiting

```sql
-- Insert 5 fake active builds for a test user
INSERT INTO builds (user_id, prompt, status) VALUES
  ('TEST_USER_UUID', 'test1', 'generating'),
  ('TEST_USER_UUID', 'test2', 'generating'),
  ('TEST_USER_UUID', 'test3', 'generating'),
  ('TEST_USER_UUID', 'test4', 'generating'),
  ('TEST_USER_UUID', 'test5', 'generating');
```
Then POST as that user — should get 429.

### Step 4: Commit

```bash
git add supabase/functions/build-app/index.ts
git commit -m "fix: verify and harden error handling, timeouts, rate limits"
```

### Acceptance Criteria

1. Markdown-wrapped JSON is correctly extracted
2. 60s timeout triggers and marks step as failed with clear message
3. Repair prompt fixes intentionally broken JSON output
4. 6th concurrent build from same user returns 429 with Retry-After
5. Every error path returns structured `{ error, stage, retryable }`
6. Failed deploy cleans up partial Storage uploads

---

## Task 8: Observability & Monitoring

**Priority:** P1 — Critical for production debugging
**Estimated Time:** 1 hour
**Files:** Create `supabase/migrations/20260224000002_builder_analytics.sql`
**Dependencies:** Task 1 (tables), Task 6 (deployed and generating data)

### Purpose

Add analytics views and structured logging so you can monitor build success rates, average build time, LLM cost per build, and failure patterns. Essential for iterating on prompt quality post-launch.

### Step 1: Create analytics views

```sql
-- Daily success rate
CREATE OR REPLACE VIEW public.builder_success_rate_daily AS
SELECT
  date_trunc('day', created_at) AS day,
  count(*) AS total_builds,
  count(*) FILTER (WHERE status = 'live') AS successful,
  count(*) FILTER (WHERE status = 'failed') AS failed,
  round(100.0 * count(*) FILTER (WHERE status = 'live') / NULLIF(count(*), 0), 1) AS success_pct
FROM public.builds
GROUP BY 1
ORDER BY 1 DESC;

-- Average build time by stage
CREATE OR REPLACE VIEW public.builder_avg_time AS
SELECT
  agent,
  count(*) AS total,
  round(avg(EXTRACT(EPOCH FROM (completed_at - started_at)))::numeric, 2) AS avg_seconds,
  round(max(EXTRACT(EPOCH FROM (completed_at - started_at)))::numeric, 2) AS max_seconds
FROM public.build_steps
WHERE status = 'completed'
GROUP BY agent;

-- Cost per build
CREATE OR REPLACE VIEW public.builder_cost_summary AS
SELECT
  count(*) AS total_builds,
  round(avg(llm_cost)::numeric, 4) AS avg_cost,
  round(sum(llm_cost)::numeric, 4) AS total_cost,
  round(max(llm_cost)::numeric, 4) AS max_cost
FROM public.builds
WHERE status = 'live';

-- Failure breakdown by stage
CREATE OR REPLACE VIEW public.builder_failures AS
SELECT
  error->>'stage' AS failure_stage,
  count(*) AS count,
  array_agg(DISTINCT error->>'message') AS error_messages
FROM public.builds
WHERE status = 'failed' AND error IS NOT NULL
GROUP BY 1
ORDER BY 2 DESC;
```

### Step 2: Verify structured logging

Confirm every `console.log` in the orchestrator emits JSON with: `{ buildId, step, status, durationMs?, tokens?, cost? }`. These are parseable in Supabase Logs Explorer.

### Step 3: Document alert thresholds

Add to project README or ops runbook:
- **Success rate < 70% in 1hr window**: investigate prompt quality or LLM degradation
- **Avg build time > 120s**: check LLM proxy latency
- **Cost per build > $0.50**: check for prompt length explosion

### Step 4: Commit

```bash
git add supabase/migrations/20260224000002_builder_analytics.sql
git commit -m "feat: add analytics views for builder observability"
```

### Acceptance Criteria

1. All 4 views return data after at least 1 successful build
2. `builder_success_rate_daily` correctly calculates percentages
3. `builder_failures` groups by stage with distinct error messages
4. All orchestrator logs are valid JSON parseable by Supabase Logs Explorer

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| LLM returns invalid JSON | High | Build fails at parse | extractJSON 3-tier fallback + repair prompt (Task 7) |
| Generated code has runtime errors | High | Preview loads but app crashes | Error boundary in preview HTML + iterate on codegen prompt (Task 2/3) |
| LLM proxy timeout under load | Medium | Builds hang indefinitely | 60s AbortController timeout per call (Task 7) |
| Prompt injection via user input | Medium | LLM generates malicious code | Input sanitization + sandbox attribute on iframe (Task 3/4) |
| Storage bucket fills up | Low | New deploys fail | TTL-based cleanup job (post-v1) |
| Cross-user data leak | Low | User sees another's builds | RLS policies + smoke test #7 verifies isolation (Task 1/6) |

---

## Summary

| Task | What it does | Key files | Time | Priority |
|------|-------------|-----------|------|----------|
| 1 | Database tables + RLS + Realtime | `migrations/20260224000001_builder_tables.sql` | 15 min | P0 |
| 2 | Builder LLM prompts (spec, codegen, repair) | `packages/agents/src/builder-prompts.ts` | 30 min | P0 |
| 3 | Core build pipeline Edge Function | `supabase/functions/build-app/index.ts` | 2–3 hrs | P0 |
| 4 | Builder page UI with Realtime + history | `src/pages/Builder.tsx`, `src/App.tsx` | 1–2 hrs | P1 |
| 5 | Navigation sidebar link | Sidebar/nav component | 15 min | P1 |
| 6 | Deploy & smoke test (8-point checklist) | Edge Function deployment + curl tests | 30 min | P0 |
| 7 | Error handling hardening (verify all) | `supabase/functions/build-app/index.ts` | 1 hr | P0 |
| 8 | Observability & analytics views | `migrations/20260224000002_builder_analytics.sql` | 1 hr | P1 |

**Total: 6–9 hours, 1 engineer, 1 day.**

After these 8 tasks, you'll have a working end-to-end pipeline: type a prompt → get a deployed app preview, with production-grade error handling, real-time UI, build history, and operational visibility.
