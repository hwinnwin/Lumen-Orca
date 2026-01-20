# Orca MVP Roadmap: Fastest Path to Usable

> Goal: Get Orca working well enough to build Vybe and other apps

## Current Reality

**What's solid (use it now):**
- LLM proxy with multi-provider fallback
- Six-Nines governance engine
- Auth, security, audit logging
- Frontend dashboard
- A11 Meta-learner for continuous improvement

**What's blocking us:**
1. Agents are generic LLM wrappers - no real capability
2. Code execution isn't sandboxed - can't safely run generated code
3. Test pipeline uses mock data - no real evidence
4. Evidence storage is in-memory - lost on refresh

## The Insight

We don't need full autonomy to be useful. We need:
1. **Orchestrated LLM calls** that actually help (not generic)
2. **Human-in-the-loop** for code execution (safer, still useful)
3. **Real test results** feeding the governance engine

## MVP Definition: "Good Enough"

Orca is usable when it can:
- [ ] Take a spec and generate a structured plan (A1 working)
- [ ] Generate code that a human reviews before execution (A3/A4 with approval gate)
- [ ] Run real tests and report real metrics (A6 wired to Vitest)
- [ ] Store evidence persistently (Supabase Storage)
- [ ] Learn from outcomes (A11 already done)

## The Three Tracks

### Track 1: Agent Intelligence (Priority: HIGH)

Make agents actually useful instead of generic.

**A1 Spec Architect - Make it parse requirements**
```
Input: "Build a bushfire alert app with real-time notifications"
Output: {
  features: ["location tracking", "push notifications", "data feed integration"],
  constraints: ["offline-capable", "battery-efficient"],
  unknowns: ["which data source?", "iOS only or cross-platform?"]
}
```

**A3/A4 Code Generators - Add templates + patterns**
- Don't generate from scratch - use templates
- Language-specific patterns (React, Swift, etc.)
- AST validation before output

**A6 QA Harness - Wire to real Vitest**
- Execute `pnpm test` and capture results
- Parse coverage reports
- Feed real data to Six-Nines engine

### Track 2: Safe Execution (Priority: CRITICAL)

**Option A: Human Approval Gate (Fast)**
- Generated code shown to human
- Human clicks "approve" or "reject"
- Only approved code runs
- No sandbox needed for MVP

**Option B: Docker Sandbox (Better, slower)**
- Isolated container for code execution
- Resource limits (CPU, memory, time)
- No access to host filesystem or env vars
- Proper solution for autonomy

**Recommendation:** Start with Option A, build Option B in parallel.

### Track 3: Real Evidence (Priority: MEDIUM)

**Wire Vitest to Evidence Service**
```typescript
// Instead of mock data:
const results = await runVitest();
const coverage = parseCoverageReport();
const bundle = generateBundle({
  unitTests: results,
  coverage: coverage,
  timestamp: Date.now()
});
await supabaseStorage.upload('evidence-bundles', bundle);
```

**Create Storage Buckets**
- `evidence-bundles/` - Test reports, coverage
- `execution-logs/` - Agent run history
- `generated-code/` - Code artifacts with approval status

## Milestone Definitions

### M1: "Can Plan" (Week 1-2)
- A1 produces structured specs from natural language
- Human can review and refine
- Plans stored in database

### M2: "Can Generate" (Week 2-4)
- A3/A4 produce code from specs
- Human approval required before any execution
- Code stored with version history

### M3: "Can Test" (Week 4-6)
- A6 runs real Vitest suites
- Coverage and results feed governance engine
- Evidence persisted to Supabase Storage

### M4: "Can Learn" (Week 6-8)
- A11 analyzes real execution history
- Recommendations improve agent prompts
- Feedback loop closes

### M5: "Can Ship" (Week 8+)
- Full cycle: Spec → Code → Test → Evidence → Learn
- Human oversight at key gates
- Reliable enough for real projects

## What We Can Build RIGHT NOW

While finishing Orca, we can build apps using:

**1. Direct LLM Calls**
- Use the working `llm-proxy` edge function
- Build Vybe features that need AI but not code generation
- Analysis, summarization, recommendations

**2. Manual Orchestration**
- Run the A0 orchestrator manually
- Review outputs at each step
- Learn what agents need to improve

**3. Dashboard Extensions**
- Build Vybe-specific dashboards
- Use existing component library
- Extend the monitoring infrastructure

## Immediate Next Steps

1. **Today**: Decide on approval gate vs sandbox approach
2. **This week**: Implement A1 structured parsing
3. **Next week**: Wire Vitest to evidence service
4. **Following week**: Add A3/A4 code templates

## The Honest Timeline

| Milestone | Target | Confidence |
|-----------|--------|------------|
| M1: Can Plan | 2 weeks | High |
| M2: Can Generate | 4 weeks | Medium |
| M3: Can Test | 6 weeks | Medium |
| M4: Can Learn | 8 weeks | High (A11 exists) |
| M5: Can Ship | 10 weeks | Medium |

**Faster path**: If we accept human-in-the-loop for code execution, we can skip the sandbox work and reach "usable" in 6 weeks.

## Decision Points

1. **Human approval vs sandbox?**
   - Human approval: Faster, safer, less autonomous
   - Sandbox: Slower, enables autonomy

2. **Which agent first?**
   - A1 (Spec): Unlocks planning
   - A6 (Test): Unlocks real evidence
   - A3/A4 (Code): Highest risk, highest reward

3. **Build Vybe in parallel?**
   - Yes: Use Orca features as they ship, real feedback
   - No: Focus on Orca, ship Vybe after

---

*"Perfect is the enemy of done. Get it working, then get it right."*
