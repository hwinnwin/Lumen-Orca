# AI App Builder — Design Document

**Date:** 2026-02-24
**Approach:** Progressive Agent Activation (Approach 3)
**Goal:** Prove the agent pipeline works end-to-end: user prompt → spec → codegen → deploy → preview URL

---

## 1. Architecture Overview

Users submit a natural language prompt describing a full-stack app. The A0 orchestrator runs a DAG of agents that produce a structured spec (A1), generate source files (A3), and deploy to Supabase. Everything runs on existing Supabase infrastructure — Edge Functions for compute, PostgreSQL for state, Storage for generated files.

### v1 Pipeline

```
User Prompt
    │
    ▼
Build API (new Edge Function)
    │  Creates build record, kicks off A0
    ▼
A0 Orchestrator (real DAG execution)
    │
    ▼
A1 Spec Architect (LLM call via /llm-proxy)
    │  Outputs: file manifest, data model, Edge Function definitions
    ▼
A3 Codegen Path A (LLM call(s) via /llm-proxy)
    │  Outputs: actual source files (React + Edge Functions + SQL)
    ▼
Deploy Service
    │  Runs migration, deploys Edge Functions, serves frontend
    ▼
Preview URL → user
```

All LLM calls go through the existing multi-provider `/llm-proxy` Edge Function with automatic fallback routing.

---

## 2. Data Model

### `builds` table

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid PK | Build ID (returned for polling) |
| user_id | uuid FK → auth.users | Who initiated the build |
| prompt | text | Original user input |
| status | text | pending / specifying / generating / deploying / live / failed |
| spec | jsonb | A1's structured output |
| generated_files | jsonb | A3's output (filename → content map) |
| preview_url | text | Live preview URL once deployed |
| error | jsonb | Error details if failed |
| llm_cost | numeric | Total LLM cost across all agent calls |
| created_at | timestamptz | Build start time |
| completed_at | timestamptz | Build finish time |

### `build_steps` table

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid PK | Step ID |
| build_id | uuid FK → builds | Parent build |
| agent | text | Which agent (A0, A1, A3, deploy) |
| status | text | pending / running / completed / failed |
| input | jsonb | What was passed to the agent |
| output | jsonb | What the agent returned |
| tokens_used | integer | LLM tokens consumed |
| cost | numeric | LLM cost for this step |
| started_at | timestamptz | Step start |
| completed_at | timestamptz | Step end |

Build steps mirror to `agent_execution_history` so the A11 meta-learner can learn from real builds.

---

## 3. Agent Contracts

### A1 Spec Architect

**Input:**
```json
{ "prompt": "Build a todo app with...", "build_id": "uuid" }
```

**Output (structured JSON):**
```json
{
  "app_name": "todo-app",
  "description": "A task management app with...",
  "data_model": {
    "tables": [{ "name": "tasks", "columns": [
      { "name": "id", "type": "uuid", "primary": true },
      { "name": "title", "type": "text" },
      { "name": "completed", "type": "boolean", "default": false }
    ]}]
  },
  "files": [
    { "path": "src/App.tsx", "purpose": "Root component with routing" },
    { "path": "src/components/TaskList.tsx", "purpose": "Displays tasks" }
  ],
  "edge_functions": [
    { "name": "api-tasks", "purpose": "CRUD for tasks" }
  ],
  "dependencies": ["react", "react-router-dom", "@supabase/supabase-js"]
}
```

### A3 Codegen Path A

**Input:** A1's spec output

**Output:**
```json
{
  "files": {
    "src/App.tsx": "import React from 'react'...",
    "src/components/TaskList.tsx": "...",
    "supabase/functions/api-tasks/index.ts": "..."
  },
  "migration": "CREATE TABLE tasks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ...);"
}
```

For large apps, A3 makes multiple LLM calls — one per file or group of files. The orchestrator handles chunking based on file manifest size.

---

## 4. Deploy Service

Three steps:

1. **Run migration** — Execute A3's SQL against a build-specific schema (`build_<id>`) for isolation.
2. **Deploy Edge Functions** — Use Supabase Management API. Functions prefixed with build ID (e.g., `build-abc123-api-tasks`).
3. **Serve frontend** — Upload generated files to Supabase Storage. A `preview-<build_id>` Edge Function serves them as a static site.

**Preview URL:** `https://<project>.supabase.co/functions/v1/preview-<build_id>`

### Isolation per build

- Own DB schema (`build_<id>`)
- Prefixed Edge Functions
- Own Storage folder

---

## 5. Frontend — Builder Page

New page at `/builder` with minimal UI:

- **Prompt input** — Text area + "Build" button
- **Build status** — Polls `builds` table via React Query. Shows current agent (specifying → generating → deploying → live)
- **Preview iframe** — Embeds the preview URL once live
- **Step log** — Expandable panel showing `build_steps` for debugging

Uses existing shadcn/ui components. Fits into the current app shell and routing.

---

## 6. Progressive Activation Roadmap

| Version | Agents | Adds |
|---------|--------|------|
| v1 | A0 → A1 → A3 → Deploy | Working end-to-end pipeline |
| v2 | + A2 | Architecture decisions before codegen |
| v3 | + A4 + A5 | Dual codegen + adjudication |
| v4 | + A6 + A7 | Automated testing + quality reports |
| v5 | + A8 + A9 | Performance and security analysis |
| v6 | + A11 | Self-improvement from build history |

v1 is what we build now. Each subsequent version is a discrete milestone.

---

## 7. Key Decisions

- **No new infrastructure.** Everything runs on existing Supabase (Edge Functions, DB, Storage).
- **Multi-provider LLM.** All agent calls go through `/llm-proxy` with fallback routing.
- **Build isolation via schemas.** Each build gets its own DB schema to prevent cross-contamination.
- **Real agent execution.** A0 orchestrator runs a real DAG with real LLM calls — no more simulated responses.
- **Progressive activation.** Start with 3 agents, prove it works, then layer in complexity.
