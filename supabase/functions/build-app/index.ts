import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── Inline prompts (Edge Functions can't import from packages/) ─────────────

const BUILDER_SPEC_PROMPT = `You are the Spec Architect for Lumen-Orca's AI App Builder.

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

const BUILDER_CODEGEN_PROMPT = `You are the Code Generator for Lumen-Orca's AI App Builder.

Given a structured app specification, generate a SINGLE self-contained JavaScript file with all components.

CRITICAL RULES:
- Output ONLY valid JSON, no markdown, no explanation, no code fences
- Generate complete, working code — no placeholders, no TODOs
- ALL components must be in ONE file called "app.js"
- Do NOT use JSX syntax (<div>, <Component/>, etc.) — use the h() helper function instead
- Do NOT use TypeScript — plain JavaScript only
- Style with Tailwind CSS utility classes (Tailwind is pre-loaded)
- The following variables are already available in scope — do NOT redeclare them:
  - h (alias for React.createElement)
  - React, useState, useEffect, useCallback, useMemo, useRef, useReducer, Fragment
  - supabase (Supabase client, already connected)

THE h() FUNCTION:
h() is React.createElement. Use it like this:
  h('div', { className: 'p-4' }, 'Hello')           // <div className="p-4">Hello</div>
  h('div', null, h('span', null, 'child'))           // nested elements
  h(MyComponent, { title: 'Hi' })                    // custom component
  h('button', { onClick: () => alert('!') }, 'Click') // event handlers
  h(Fragment, null, child1, child2)                   // fragments
  items.map(item => h('li', { key: item.id }, item.name))  // lists

OUTPUT FORMAT (strict JSON):
{
  "files": {
    "app.js": "// All components in one file using h() calls\\nfunction TodoItem({ todo, onToggle, onDelete }) { ... }\\nfunction App() { ... }"
  },
  "migration": "CREATE TABLE IF NOT EXISTS ..."
}

IMPORTANT PATTERNS:

Conditional rendering:
  condition ? h('div', null, 'yes') : null
  condition && h('div', null, 'shown')

Lists:
  h('ul', null, items.map(item => h('li', { key: item.id }, item.name)))

Forms:
  h('input', { value: val, onChange: (e) => setVal(e.target.value), className: 'border p-2 rounded' })

Supabase queries (supabase is already in scope):
  const { data, error } = await supabase.from('tablename').select('*');
  await supabase.from('tablename').insert({ column: value });
  await supabase.from('tablename').update({ column: value }).eq('id', id);
  await supabase.from('tablename').delete().eq('id', id);

EXAMPLE OUTPUT for a Todo app:
{
  "files": {
    "app.js": "function TodoItem({ todo, onToggle, onDelete }) {\\n  return h('div', { className: 'flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm' },\\n    h('input', { type: 'checkbox', checked: todo.completed, onChange: () => onToggle(todo.id), className: 'h-5 w-5' }),\\n    h('span', { className: todo.completed ? 'flex-1 line-through text-gray-400' : 'flex-1 text-gray-800' }, todo.title),\\n    h('button', { onClick: () => onDelete(todo.id), className: 'text-red-500 hover:text-red-700 text-sm' }, 'Delete')\\n  );\\n}\\n\\nfunction App() {\\n  const [todos, setTodos] = useState([]);\\n  const [newTodo, setNewTodo] = useState('');\\n  const [loading, setLoading] = useState(true);\\n\\n  const fetchTodos = useCallback(async () => {\\n    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });\\n    if (data) setTodos(data);\\n    setLoading(false);\\n  }, []);\\n\\n  useEffect(() => { fetchTodos(); }, [fetchTodos]);\\n\\n  const addTodo = async () => {\\n    if (!newTodo.trim()) return;\\n    await supabase.from('tasks').insert({ title: newTodo.trim() });\\n    setNewTodo('');\\n    fetchTodos();\\n  };\\n\\n  const toggleTodo = async (id) => {\\n    const todo = todos.find(t => t.id === id);\\n    await supabase.from('tasks').update({ completed: !todo.completed }).eq('id', id);\\n    fetchTodos();\\n  };\\n\\n  const deleteTodo = async (id) => {\\n    await supabase.from('tasks').delete().eq('id', id);\\n    fetchTodos();\\n  };\\n\\n  if (loading) return h('div', { className: 'flex justify-center p-8' }, h('div', { className: 'text-gray-500' }, 'Loading...'));\\n\\n  return h('div', { className: 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6' },\\n    h('div', { className: 'max-w-lg mx-auto' },\\n      h('h1', { className: 'text-3xl font-bold text-gray-800 mb-6 text-center' }, 'Todo List'),\\n      h('div', { className: 'flex gap-2 mb-6' },\\n        h('input', { value: newTodo, onChange: (e) => setNewTodo(e.target.value), onKeyDown: (e) => e.key === 'Enter' && addTodo(), placeholder: 'Add a task...', className: 'flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400' }),\\n        h('button', { onClick: addTodo, className: 'bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors' }, 'Add')\\n      ),\\n      h('div', { className: 'space-y-2' }, todos.map(todo => h(TodoItem, { key: todo.id, todo, onToggle: toggleTodo, onDelete: deleteTodo })))\\n    )\\n  );\\n}"
  },
  "migration": "CREATE TABLE IF NOT EXISTS tasks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, completed boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());"
}

COMMON MISTAKES TO AVOID:
- Do NOT use JSX syntax — browsers cannot parse it. Always use h() calls
- Do NOT use TypeScript type annotations — browsers cannot parse them
- Do NOT use import/export statements — everything runs in one scope
- Do NOT redeclare React, useState, useEffect, h, supabase — they are already available
- Do NOT wrap output in \`\`\`json code fences
- Do NOT use placeholder comments like "// TODO" or "// add logic here"
- Do NOT forget to define ALL component functions before App uses them`;

const BUILDER_REPAIR_PROMPT = `You are a JSON repair assistant.

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

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_PROMPT_LENGTH = 5000;
const MAX_CONCURRENT_BUILDS = 5;
const LLM_TIMEOUT_MS = 120_000; // 2 minutes for complex apps
const STORAGE_BUCKET = "builder-previews";
const SIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hour

// ─── Types ───────────────────────────────────────────────────────────────────

interface BuildRequest {
  prompt: string;
}

// ─── HTML escaping (Patch 5) ─────────────────────────────────────────────────

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
};

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch]);
}

// ─── Strip lone surrogates to prevent Anthropic JSON parse errors ────────────

function sanitizeUnicode(str: string): string {
  // Remove lone high surrogates (U+D800–U+DBFF) not followed by a low surrogate,
  // and lone low surrogates (U+DC00–U+DFFF) not preceded by a high surrogate.
  // These cause "no low surrogate in string" errors in Anthropic's API.
  return str.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, "")
            .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "");
}

// ─── JSON extraction with 4-tier fallback ────────────────────────────────────

function extractJSON(text: string): unknown {
  const errors: string[] = [];

  // Tier 1: Direct parse
  try {
    return JSON.parse(text);
  } catch (e) {
    errors.push(`direct: ${(e as Error).message}`);
  }

  // Tier 2: Strip markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch (e) {
      errors.push(`fence: ${(e as Error).message}`);
    }
  }

  // Tier 3: Find outermost JSON object (greedy)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      errors.push(`greedy: ${(e as Error).message}`);
    }
  }

  // Tier 4: Find JSON by brace-counting (handles truncated trailing content)
  try {
    const start = text.indexOf("{");
    if (start !== -1) {
      let depth = 0;
      let inString = false;
      let escape = false;
      let lastValidEnd = -1;

      for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (escape) { escape = false; continue; }
        if (ch === "\\") { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === "{" || ch === "[") depth++;
        if (ch === "}" || ch === "]") {
          depth--;
          if (depth === 0) { lastValidEnd = i; break; }
        }
      }

      if (lastValidEnd > start) {
        const candidate = text.slice(start, lastValidEnd + 1);
        return JSON.parse(candidate);
      }
    }
  } catch (e) {
    errors.push(`brace-count: ${(e as Error).message}`);
  }

  const preview = text.slice(0, 200).replace(/\n/g, "\\n");
  throw new Error(
    `Failed to extract valid JSON from LLM response. ` +
    `Tiers tried: ${errors.join(" | ")}. ` +
    `Response preview: ${preview}...`,
  );
}

// ─── Main handler ────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ─── Auth enforcement (Patch 1) ──────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Missing Authorization header", retryable: false }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const token = authHeader.replace("Bearer ", "");

  // Service-role client for DB mutations (bypasses RLS)
  // Use JWT_SERVICE_ROLE_KEY (legacy JWT format) since SUPABASE_SERVICE_ROLE_KEY
  // may be the new publishable-key format which isn't compatible with supabase-js
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("JWT_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Invalid or expired token", retryable: false }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // userId is guaranteed non-null from this point forward
  const userId: string = user.id;

  // ─── Parse body ──────────────────────────────────────────────────────────
  let body: BuildRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body", retryable: false }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const { prompt } = body;

  // ─── Input validation ────────────────────────────────────────────────────
  if (!prompt || !prompt.trim()) {
    return new Response(
      JSON.stringify({ error: "Prompt is required", retryable: false }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return new Response(
      JSON.stringify({
        error: `Prompt too long (max ${MAX_PROMPT_LENGTH} chars)`,
        retryable: false,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // ─── Rate limit: max concurrent builds per user ──────────────────────────
  const { count } = await supabase
    .from("builds")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["pending", "specifying", "generating", "deploying"]);

  if ((count ?? 0) >= MAX_CONCURRENT_BUILDS) {
    return new Response(
      JSON.stringify({
        error: `Too many active builds (max ${MAX_CONCURRENT_BUILDS}). Wait for current builds to finish.`,
        retryable: true,
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": "30",
        },
      },
    );
  }

  // ─── Pipeline begins ────────────────────────────────────────────────────

  // 1. Create build record
  const { data: build, error: buildError } = await supabase
    .from("builds")
    .insert({ prompt, user_id: userId, status: "pending" })
    .select()
    .single();

  if (buildError || !build) {
    return new Response(
      JSON.stringify({
        error: `Failed to create build: ${buildError?.message ?? "unknown"}`,
        retryable: true,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const buildId: string = build.id;
  console.log(JSON.stringify({ buildId, step: "init", status: "started", userId }));

  // ─── Pipeline helpers ──────────────────────────────────────────────────

  async function updateBuild(updates: Record<string, unknown>) {
    await supabase.from("builds").update(updates).eq("id", buildId);
  }

  async function createStep(agent: string): Promise<string> {
    const { data, error } = await supabase
      .from("build_steps")
      .insert({
        build_id: buildId,
        agent,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error || !data) {
      throw new Error(`Failed to create build step for ${agent}: ${error?.message ?? "no data"}`);
    }
    return data.id;
  }

  async function completeStep(
    stepId: string,
    output: unknown,
    tokens: number,
    cost: number,
  ) {
    await supabase
      .from("build_steps")
      .update({
        status: "completed",
        output,
        tokens_used: tokens,
        cost,
        completed_at: new Date().toISOString(),
      })
      .eq("id", stepId);
  }

  async function failStep(stepId: string, errorMsg: string) {
    await supabase
      .from("build_steps")
      .update({
        status: "failed",
        output: { error: errorMsg },
        completed_at: new Date().toISOString(),
      })
      .eq("id", stepId);
  }

  // ─── LLM call with AbortController timeout ──────────────────────────────

  async function callLLM(
    agentRole: string,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<{ result: string; usage: Record<string, unknown> }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

    try {
      const response = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/llm-proxy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("JWT_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            agentRole,
            prompt: sanitizeUnicode(userPrompt),
            systemPrompt: sanitizeUnicode(systemPrompt),
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`LLM proxy error (${response.status}): ${errText}`);
      }

      return await response.json();
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error(
          `LLM call timed out after ${LLM_TIMEOUT_MS / 1000}s`,
        );
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  // ─── Parse with repair retry ─────────────────────────────────────────────

  async function parseWithRepair(
    rawResult: string,
    stepName: string,
  ): Promise<unknown> {
    try {
      return extractJSON(rawResult);
    } catch (parseErr: unknown) {
      const parseMessage =
        parseErr instanceof Error ? parseErr.message : String(parseErr);

      console.log(
        JSON.stringify({
          buildId,
          step: stepName,
          status: "repair_attempt",
          error: parseMessage,
        }),
      );

      // One retry with repair prompt
      const repairResult = await callLLM(
        "repair",
        BUILDER_REPAIR_PROMPT,
        `RAW OUTPUT:\n${rawResult}\n\nPARSE ERROR:\n${parseMessage}`,
      );

      return extractJSON(repairResult.result);
    }
  }

  // ─── Pipeline execution ──────────────────────────────────────────────────

  try {
    // ──── 2. A1 Spec ─────────────────────────────────────────────────────
    await updateBuild({ status: "specifying" });
    const specStepId = await createStep("A1_spec");
    const specStartTime = Date.now();

    let spec: Record<string, unknown>;
    try {
      const specResult = await callLLM(
        "A1_spec",
        BUILDER_SPEC_PROMPT,
        `Build this app: ${prompt}`,
      );

      spec = (await parseWithRepair(
        specResult.result,
        "A1_spec",
      )) as Record<string, unknown>;

      const specDuration = Date.now() - specStartTime;
      const specUsage = specResult.usage as Record<string, number> | undefined;
      const specTokens =
        (specUsage?.tokensInput || 0) + (specUsage?.tokensOutput || 0);
      const specCost = specUsage?.estimatedCost || 0;

      await completeStep(specStepId, spec, specTokens, specCost);
      await updateBuild({ spec, llm_cost: specCost });

      console.log(
        JSON.stringify({
          buildId,
          step: "A1_spec",
          status: "completed",
          durationMs: specDuration,
          tokens: specTokens,
          cost: specCost,
          appName: spec.app_name,
        }),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      await failStep(specStepId, msg);
      await updateBuild({
        status: "failed",
        error: { stage: "spec", message: msg, retryable: true },
        completed_at: new Date().toISOString(),
      });
      throw err;
    }

    // ──── 3. A3 Codegen ──────────────────────────────────────────────────
    await updateBuild({ status: "generating" });
    const codegenStepId = await createStep("A3_codegen_a");
    const codegenStartTime = Date.now();

    let generated: Record<string, unknown>;
    try {
      const codegenResult = await callLLM(
        "A3_codegen_a",
        BUILDER_CODEGEN_PROMPT,
        `Generate all code for this app specification:\n${JSON.stringify(spec, null, 2)}`,
      );

      generated = (await parseWithRepair(
        codegenResult.result,
        "A3_codegen_a",
      )) as Record<string, unknown>;

      const codegenDuration = Date.now() - codegenStartTime;
      const codegenUsage = codegenResult.usage as
        | Record<string, number>
        | undefined;
      const codegenTokens =
        (codegenUsage?.tokensInput || 0) + (codegenUsage?.tokensOutput || 0);
      const codegenCost = codegenUsage?.estimatedCost || 0;

      const generatedFiles = (generated.files || {}) as Record<string, unknown>;
      await completeStep(
        codegenStepId,
        { fileCount: Object.keys(generatedFiles).length },
        codegenTokens,
        codegenCost,
      );
      await updateBuild({
        generated_files: generated,
        llm_cost: ((build.llm_cost as number) || 0) + codegenCost,
      });

      console.log(
        JSON.stringify({
          buildId,
          step: "A3_codegen_a",
          status: "completed",
          durationMs: codegenDuration,
          tokens: codegenTokens,
          cost: codegenCost,
          fileCount: Object.keys(generatedFiles).length,
        }),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      await failStep(codegenStepId, msg);
      await updateBuild({
        status: "failed",
        error: { stage: "codegen", message: msg, retryable: true },
        completed_at: new Date().toISOString(),
      });
      throw err;
    }

    // ──── 4. Deploy ──────────────────────────────────────────────────────
    await updateBuild({ status: "deploying" });
    const deployStepId = await createStep("deploy");
    const deployStartTime = Date.now();

    // User-namespaced path (Patch 2)
    const filePath = `${userId}/${buildId}/index.html`;

    try {
      // 4a. Run migration if provided
      if (generated.migration) {
        const { error: migrationError } = await supabase.rpc("exec_sql", {
          query: generated.migration,
        });
        if (migrationError) {
          console.warn(
            JSON.stringify({
              buildId,
              step: "deploy",
              status: "migration_warning",
              error: migrationError.message,
            }),
          );
        }
      }

      // 4b. Ensure PRIVATE storage bucket exists (Patch 2: public: false)
      await supabase.storage
        .createBucket(STORAGE_BUCKET, { public: false })
        .catch(() => {
          // Bucket may already exist — ignore
        });

      // 4c. Build self-contained preview HTML with supabaseUrl and anonKey
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const anonKey = Deno.env.get("JWT_ANON_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
      const previewHtml = buildPreviewHtml(generated, spec, supabaseUrl, anonKey);

      // 4d. Upload preview to PRIVATE bucket with user-namespaced path
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, new Blob([previewHtml], { type: "text/html" }), {
          contentType: "text/html",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // 4e. Build preview URL via the preview Edge Function (serves HTML with correct headers)
      const previewUrl = `${supabaseUrl}/functions/v1/preview?build_id=${buildId}`;
      const deployDuration = Date.now() - deployStartTime;

      await completeStep(deployStepId, { previewUrl }, 0, 0);
      await updateBuild({
        status: "live",
        preview_url: previewUrl,
        completed_at: new Date().toISOString(),
      });

      console.log(
        JSON.stringify({
          buildId,
          step: "deploy",
          status: "completed",
          durationMs: deployDuration,
          previewUrl,
        }),
      );

      return new Response(
        JSON.stringify({
          buildId,
          status: "live",
          previewUrl,
          previewHtml,
          spec,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    } catch (err: unknown) {
      // Clean up partial uploads on deploy failure
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath])
        .catch(() => {
          // best-effort cleanup
        });

      const msg = err instanceof Error ? err.message : String(err);
      await failStep(deployStepId, msg);
      await updateBuild({
        status: "failed",
        error: { stage: "deploy", message: msg, retryable: true },
        completed_at: new Date().toISOString(),
      });
      throw err;
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Build failed";

    console.error(
      JSON.stringify({
        buildId,
        step: "fatal",
        status: "failed",
        error: errorMessage,
      }),
    );

    return new Response(
      JSON.stringify({
        error: errorMessage,
        retryable: true,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

// ─── Preview HTML builder ────────────────────────────────────────────────────

/**
 * Strip TypeScript type annotations from code so it runs in a browser.
 * Handles common patterns: type params, return types, variable annotations,
 * interface/type declarations.
 */
function stripTypeScript(code: string): string {
  return code
    // Remove interface/type declarations (entire block)
    .replace(/^(export\s+)?(interface|type)\s+\w+[\s\S]*?(?=\n(?:function|const|let|var|class|\/\/|\/\*|$))/gm, "")
    // Remove : Type annotations on variables/params (simple cases)
    .replace(/:\s*(?:string|number|boolean|void|any|null|undefined|never|unknown|React\.\w+)(?:\[\])?/g, "")
    // Remove generic type params <T> on function calls
    .replace(/<(?:string|number|boolean|any|unknown|Record|Array|Promise)\b[^>]*>/g, "")
    // Remove 'as Type' casts
    .replace(/\s+as\s+\w+(?:\[\])?/g, "");
}

/**
 * Collect all generated code files into a single inlined string.
 * Prefers "app.js" (new prompt format), falls back to concatenating
 * all src/*.tsx / src/*.jsx files (legacy prompt format).
 */
function collectAppCode(files: Record<string, string>): string {
  // New format: single app.js
  if (files["app.js"]) {
    return files["app.js"];
  }

  // Legacy format: concatenate all source files in dependency order
  const sortOrder = ["src/lib/", "src/components/", "src/pages/", "src/App"];
  const sourceFiles = Object.entries(files)
    .filter(([path]) => path.endsWith(".tsx") || path.endsWith(".jsx") || path.endsWith(".ts") || path.endsWith(".js"))
    .filter(([path]) => !path.includes("index.html"))
    .sort(([a], [b]) => {
      const aIdx = sortOrder.findIndex((prefix) => a.startsWith(prefix));
      const bIdx = sortOrder.findIndex((prefix) => b.startsWith(prefix));
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
    });

  if (sourceFiles.length === 0) {
    return 'function App() { return h("div", { className: "p-8 text-center text-gray-500" }, "No app code generated"); }';
  }

  // Strip imports/exports and TS types, then concatenate
  const chunks = sourceFiles.map(([_path, code]) => {
    let cleaned = code
      // Remove import statements (single and multi-line)
      .replace(/import\s+[\s\S]*?\s+from\s+['"][^'"]+['"];?\n?/g, "")
      .replace(/import\s+['"][^'"]+['"];?\n?/g, "")
      // Convert export default to assignment
      .replace(/export\s+default\s+function\s+(\w+)/g, "function $1")
      .replace(/export\s+default\s+/g, "const _default = ")
      // Remove other exports
      .replace(/export\s+(?:const|let|var|function|class)\s+/g, "function ".includes("function") ? "const " : "const ");

    // Fix: more precise export replacement
    cleaned = code
      .replace(/import[\s\S]*?from\s*['"][^'"]*['"];?\s*\n?/g, "")
      .replace(/import\s*['"][^'"]*['"];?\s*\n?/g, "")
      .replace(/export\s+default\s+function\s+/g, "function ")
      .replace(/export\s+default\s+class\s+/g, "class ")
      .replace(/export\s+default\s+/g, "const _default = ")
      .replace(/export\s+(const|let|var|function|class)\s+/g, "$1 ");

    cleaned = stripTypeScript(cleaned);
    return cleaned;
  });

  // Ensure last file defines App
  const combined = chunks.join("\n\n");
  if (!/function\s+App\s*\(/.test(combined) && !combined.includes("const App")) {
    return combined + '\nfunction App() { return h("div", { className: "p-8" }, "App"); }';
  }
  return combined;
}

/**
 * Builds a self-contained HTML preview that inlines all generated React code.
 * Uses Babel standalone for JSX transpilation fallback.
 * Uses ESM imports from esm.sh for React/ReactDOM.
 *
 * Security (Patch 5): All dynamic values are escaped via escapeHtml.
 * Injection (Patch 2): supabaseUrl and anonKey injected as escaped meta tags.
 */
function buildPreviewHtml(
  generated: Record<string, unknown>,
  spec: Record<string, unknown>,
  supabaseUrl: string,
  anonKey: string,
): string {
  const files = (generated.files || {}) as Record<string, string>;
  const appCode = collectAppCode(files);

  const escapedAppName = escapeHtml(
    String(spec.app_name || "Lumen App"),
  );
  const escapedSupabaseUrl = escapeHtml(supabaseUrl);
  const escapedAnonKey = escapeHtml(anonKey);

  // Escape </script> in user code to prevent breaking out of the script tag
  const safeAppCode = appCode.replace(/<\/script>/gi, "<\\/script>");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="supabase-url" content="${escapedSupabaseUrl}" />
  <meta name="supabase-anon-key" content="${escapedAnonKey}" />
  <title>${escapedAppName}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script src="https://unpkg.com/@babel/standalone@7.24.7/babel.min.js"><\/script>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; }
    #loading { display: flex; align-items: center; justify-content: center; min-height: 100vh; color: #6b7280; font-size: 1.125rem; }
    .error-boundary { padding: 2rem; color: #dc2626; font-family: monospace; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div id="root"><div id="loading">Loading app...</div></div>

  <!-- Phase 1: Load dependencies as ES modules -->
  <script type="module">
    import React from 'https://esm.sh/react@18';
    import ReactDOM from 'https://esm.sh/react-dom@18/client';
    import * as ReactAll from 'https://esm.sh/react@18';
    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

    // Expose to global scope for Phase 2
    window.__React = React;
    window.__ReactDOM = ReactDOM;
    window.__ReactAll = ReactAll;
    window.__createClient = createClient;
    window.__depsReady = true;

    // Dispatch event so Phase 2 knows deps are loaded
    window.dispatchEvent(new Event('deps-ready'));
  <\/script>

  <!-- Phase 2: Run app code (waits for deps, uses Babel for JSX fallback) -->
  <script>
    function bootApp() {
      var React = window.__React;
      var ReactDOM = window.__ReactDOM;
      var h = React.createElement;
      var Fragment = React.Fragment;
      var useState = React.useState;
      var useEffect = React.useEffect;
      var useCallback = React.useCallback;
      var useMemo = React.useMemo;
      var useRef = React.useRef;
      var useReducer = React.useReducer;
      var Component = React.Component;

      // Supabase client
      var sbUrl = document.querySelector('meta[name="supabase-url"]')?.getAttribute('content') || '';
      var sbKey = document.querySelector('meta[name="supabase-anon-key"]')?.getAttribute('content') || '';
      var supabase = window.__createClient(sbUrl, sbKey);

      // Error Boundary
      class ErrorBoundary extends Component {
        constructor(props) {
          super(props);
          this.state = { hasError: false, error: null };
        }
        static getDerivedStateFromError(error) {
          return { hasError: true, error };
        }
        componentDidCatch(error, info) {
          console.error('ErrorBoundary caught:', error, info);
        }
        render() {
          if (this.state.hasError) {
            return h('div', { className: 'error-boundary' },
              h('h2', null, 'Something went wrong'),
              h('pre', null, String(this.state.error)),
              h('button', {
                onClick: () => this.setState({ hasError: false, error: null }),
                style: { marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '0.375rem' }
              }, 'Try Again')
            );
          }
          return this.props.children;
        }
      }

      // ── App Code (generated by LLM) ──
      try {
        ${safeAppCode}

        // Mount
        var root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(h(ErrorBoundary, null, h(typeof App !== 'undefined' ? App : function() { return h('div', {className:'p-8 text-gray-500'}, 'App loaded'); })));
      } catch (evalErr) {
        // If plain JS fails, try Babel transpilation (JSX fallback)
        console.warn('Direct eval failed, trying Babel transpilation:', evalErr.message);
        try {
          var appSource = ${JSON.stringify(appCode)};
          var transformed = Babel.transform(appSource, {
            presets: ['react'],
            plugins: [],
          }).code;

          // Eval the transpiled code
          eval(transformed);

          var root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(h(ErrorBoundary, null, h(typeof App !== 'undefined' ? App : function() { return h('div', null, 'App loaded'); })));
        } catch (babelErr) {
          console.error('Babel transpilation also failed:', babelErr);
          document.getElementById('root').innerHTML = '<div class="error-boundary"><h2>Build Error</h2><pre>' +
            'Direct: ' + evalErr.message + '\\n\\nBabel: ' + babelErr.message + '</pre></div>';
        }
      }
    }

    // Wait for ESM deps to load, then boot
    if (window.__depsReady) {
      bootApp();
    } else {
      window.addEventListener('deps-ready', bootApp);
    }
  <\/script>
</body>
</html>`;
}
