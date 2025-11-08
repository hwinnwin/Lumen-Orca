# Lumen-Orca Agent Modernization Workspace Prompt

This prompt is optimized for Codex Cloud (or similar workspace-aware assistants) to extract everything needed for replacing the mock A1–A10 agents with real, LLM-backed modules that plug into the orchestrator, evidence pipeline, QA grading, and Supabase integrations.

Use it from the repository root when you need a comprehensive scan of the current contracts, orchestration logic, evidence plumbing, QA helpers, and UI exposure related to agent execution.

---

```markdown
## Lumen-Orca Agent Modernization: Workspace Data Extraction Prompt

Project mission: Replace mock A1–A10 agents with real, LLM-backed modules that interact with orchestrator state, Supabase LLM proxy, evidence pipeline, and QA grading.  
Scan the codebase and provide:

**1. Agent Contracts & Type Definitions**
- List all TypeScript types/interfaces for agent tasks, agent state, evidence bundle schema, quality gates, requirements, and agent events/logs.
- Note where contracts are duplicated, diverged, or require normalization (across packages/agents, packages/contracts, packages/evidence, etc.).

**2. Orchestrator Simulation & Mock Agent Flows**
- Detail the logic in packages/agents/src/A0_orchestrator.ts and A1_spec_architect.ts:  
  - How are tasks created, scheduled (topological), and executed?
  - Which function(s) simulate agent execution—inputs, outputs, error handling, JSON parsing?
  - Where do agent metrics update (latency, errors, blocker states)?
- Summarize the orchestratorService singleton and hooks such as useOrchestrator, outlining lifecycle and state/subscriber updates.

**3. Supabase LLM Proxy Integration**
- Show client-side code for invoking the LLM proxy (src/integrations/supabase/client.ts, executeAgent).
- Show edge function/router handling (supabase/functions/llm-proxy/index.ts) for provider selection, health, fallback, budget, and return type.
- List provider adapters (openai.ts, anthropic.ts, google.ts, lovable-ai.ts) and expected response shape.

**4. Evidence Creation & QA Metrics Pipeline**
- Trace bundle creation flow: how is orchestrator state converted to EvidenceBundle (packages/evidence/src/bundle.ts)?
- How are QA metrics (mutation, coverage, flake rate) computed, graded, and mapped to gates/letter grades (packages/qa)?
- Show the code for in-memory and persistent storage (evidenceService, Supabase integration if present).

**5. Orchestration Config, DAG Safety, & Task Routing**
- Detail how tasks are registered, dependencies/cycles prevented, parallelism enforced, and workflow loaded from YAML/manifest.
- Describe how deadlocks and dependency blocks are surfaced and handled.

**6. UI Surfaces for Agent & Evidence State**
- List all dashboard/react components and hooks (OrchestrationGraph, AgentStatusGrid, MetricsPanel, Evidence page) that consume orchestrator/agent/evidence state:
  - Props, shape of exposed state, refresh/update mechanism, animation logic.
  - How user actions (start/reset, manifest load) propagate state.

**7. Gaps, Blockers, and Refactor Recommendations**
- What classes/functions remain as stubs or simulated? 
- What QA/metrics and evidence flows are hard-coded or only in memory?  
- Recommend required refactors and new module stubs to enable real agent execution, artefact persistence, and UI/metrics integration.

**Goal:**  
Output enough context, type contracts, and code touch-points to let a developer replace all mocks with true LLM-powered agents, enable real QA-driven pipeline and persistent evidence bundles, and fully wire agent/data flows into the UI surfaces.

```

---

**Tip:** Run this prompt after major refactors to keep your mental model of the agent stack current. Extend it with follow-up prompts for stub generation, edge function hardening, or UI harnessing as your rollout progresses.
