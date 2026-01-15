# AI Builder Platform — Production Architecture

> **Prompt Engineering as Infrastructure**

## Executive Summary

The AI Builder Platform lets users create any AI they want without knowing how to prompt. We engineer reliable, safe, high-performance prompt stacks behind the scenes.

**We sell:**
- Predictability
- Control
- Behavior integrity

This is infrastructure, not a novelty product.

---

## 1. Product Scope

### What This Platform IS
- A meta-layer on top of LLMs
- A prompt operating environment
- A behavior-shaping system

### What This Platform IS NOT
- Not a chatbot playground
- Not a companion-only app
- Not a "prompt marketplace"
- Not a roleplay farm

Those can exist inside it later.

---

## 2. Core Architecture

### AI Object Model

Each AI a user creates is an **object**, not a chat. Each AI object contains:

| Component | Purpose |
|-----------|---------|
| `purpose` | What the AI is for |
| `role` | Role definition and expertise |
| `behavior` | Behavioral constraints and strictness |
| `tone` | Language, verbosity, emotional temperature |
| `outputFormat` | How outputs are structured |
| `safety` | Hard stops, soft boundaries, AI framing |
| `memory` | Session and persistent memory policies |
| `version` | Full version history for auditing |

This makes AIs **auditable, cloneable, and stable**.

### Prompt Stack (The Moat)

No single prompts. Ever. Each AI runs on a **6-layer prompt stack**:

```
┌─────────────────────────────────────────┐
│  Layer 6: Interceptor                   │  ← Runtime checks, drift detection
├─────────────────────────────────────────┤
│  Layer 5: Session                       │  ← Context, memory boundaries
├─────────────────────────────────────────┤
│  Layer 4: Task                          │  ← Input/output handling
├─────────────────────────────────────────┤
│  Layer 3: Tone & Style                  │  ← Language, verbosity, formality
├─────────────────────────────────────────┤
│  Layer 2: Behavior                      │  ← Role, constraints, decisions
├─────────────────────────────────────────┤
│  Layer 1: Core System (IMMUTABLE)       │  ← Platform rules, safety, legal
└─────────────────────────────────────────┘
```

Users never see most of this. That's the point.

---

## 3. Package Structure

```
packages/ai-builder/
├── src/
│   ├── core/
│   │   ├── ai-object.ts        # AI Object Model types
│   │   ├── prompt-stack.ts     # 6-layer prompt compiler
│   │   └── builder-service.ts  # Intent → Rules translation
│   │
│   ├── safety/
│   │   └── compliance-engine.ts # Compliance profiles & enforcement
│   │
│   ├── templates/
│   │   └── mvp-templates.ts    # 6 high-value templates
│   │
│   ├── onboarding/
│   │   └── onboarding-flow.ts  # No-prompt user experience
│   │
│   ├── monetization/
│   │   └── subscription-types.ts # Pricing & limits
│   │
│   └── index.ts                # Public exports
│
├── package.json
└── tsconfig.json
```

---

## 4. User Experience

### Onboarding (THE KEY)

Users do NOT write prompts. They answer:

1. **"What do you want this AI for?"** → Purpose
2. **"How strict should it be?"** → Strictness slider (1-5)
3. **"What should it never do?"** → Prohibitions
4. **"How should it speak?"** → Tone (temperature, formality, verbosity)
5. **"Who is this not allowed to imitate?"** → Safety rules

Mostly sliders, toggles, and examples. We translate human intent → machine rules.

### AI Creation Flow

```
1. Choose template or start from scratch
2. Name the AI
3. Define purpose and capabilities
4. Set behavior parameters
5. Configure tone and style
6. Review safety settings
7. Generate AI → Test in sandbox → Lock version
```

No friction. No magic jargon.

---

## 5. Safety & Compliance

### Built-In, Not Bolted-On

Hard rules enforced by the system (Layer 1 - Immutable):

- ✗ No real-person impersonation
- ✗ No copyrighted character cloning
- ✗ No illegal task assistance
- ✗ No emotional dependency reinforcement
- ✓ Clear AI framing at all times

### Compliance Profiles

| Profile | Use Case |
|---------|----------|
| `app_store` | iOS/Android distribution |
| `enterprise` | Full audit trails, SSO |
| `regulated` | Healthcare, finance, legal |
| `custom` | User-defined rules |

---

## 6. MVP Templates

Ship with high-value templates, not gimmicks:

| Template | Purpose |
|----------|---------|
| Business Analyst AI | Data analysis, reports, insights |
| Executive Assistant AI | Scheduling, communication, admin |
| Content Strategist AI | Content planning and creation |
| Coach / Reflective AI | Personal development |
| Research Assistant AI | Research synthesis |
| Companion AI (bounded) | Friendly chat with safety |

Templates are starting points, not cages.

---

## 7. Monetization

### Pricing Logic

You charge for:
- Number of AI objects
- Depth of tuning
- Memory length
- Team sharing
- Compliance features

### Tiers

| Tier | AI Objects | Key Features |
|------|------------|--------------|
| **Free** | 2 | Basic tuning, session memory |
| **Pro** | 10 | Advanced tuning, persistent memory, version history |
| **Team** | 50 | Shared AIs, permissions, team workspace |
| **Enterprise** | Unlimited | SSO, custom compliance, SLA |

### Add-Ons (High Margin)

- Prompt Architecture Review: $299
- Custom AI Design: $999
- Behavior Audit: $499

---

## 8. API Usage

### Building an AI

```typescript
import { buildAI, type BuilderInput, type UserId } from '@lumen-orca/ai-builder';

const input: BuilderInput = {
  name: 'My Business Analyst',
  purpose: 'Analyze sales data and identify trends',
  purposeCategory: 'business',
  capabilities: ['Analyze data', 'Create reports', 'Identify patterns'],
  exclusions: ['Provide financial advice', 'Make predictions'],
  strictness: 4,
  prohibitions: ['Making investment recommendations'],
  emotionalTemperature: 'neutral',
  formality: 'professional',
  verbosity: 'detailed',
  contentPolicy: 'standard',
  disallowedTopics: [],
  memoryMode: 'session',
};

const result = buildAI(input, 'user_123' as UserId);

// result.aiObject - The configured AI object
// result.compiledPrompt - The generated prompt stack
// result.warnings - Any validation warnings
```

### Quick Build from Preset

```typescript
import { quickBuildAI } from '@lumen-orca/ai-builder';

const result = quickBuildAI(
  'professional_assistant',
  'My Assistant',
  'Help me with daily tasks',
  'user_123' as UserId
);
```

### Using Templates

```typescript
import { getTemplate, templateToBuilderInput, buildAI } from '@lumen-orca/ai-builder';

const template = getTemplate('business_analyst');
const input = templateToBuilderInput(template!, 'My Analyst', 'Custom purpose here');
const result = buildAI(input, 'user_123' as UserId);
```

### Compliance Check

```typescript
import { getComplianceEngine } from '@lumen-orca/ai-builder';

const engine = getComplianceEngine();
const report = engine.generateReport(aiObject);

console.log(report.summary);
// "This AI meets enterprise compliance requirements with full audit support."
```

---

## 9. Integration with Lumen-Orca

The AI Builder Platform integrates with the existing Lumen-Orca agent system:

| Lumen-Orca Component | AI Builder Integration |
|----------------------|------------------------|
| `packages/agents/` | AI objects extend agent patterns |
| `src/lib/agent-llm-integration.ts` | Compiled prompts route through LLM proxy |
| `src/lib/audit-logger.ts` | Safety events logged to audit system |
| `supabase/functions/llm-proxy/` | Multi-provider routing for AI execution |

---

## 10. Production Checklist

### MVP Scope ✓

- [x] AI object creation
- [x] Prompt stack generation (6 layers)
- [x] 6 MVP templates
- [x] Onboarding flow definition
- [x] Safety/compliance engine
- [x] Subscription tier types

### Future (v1.1+)

- [ ] Sandbox testing UI
- [ ] Version locking UI
- [ ] Subscription billing integration
- [ ] Team workspace
- [ ] AI marketplace (later)

---

## 11. Positioning

You are not:
- An AI chatbot app
- A prompt tool
- A no-code gimmick

You are:
> **The control layer between humans and intelligent systems**

That's a strong long-term position. This one compounds.

---

## Status

| Item | Status |
|------|--------|
| Concept | ✅ Locked |
| Architecture | ✅ Defined |
| Safety | ✅ Integrated |
| Monetization | ✅ Clear |
| MVP Scope | ✅ Defined |
| Types & Interfaces | ✅ Complete |
| Parallelizable with OS work | ✅ Yes |

**This is fully production-ready as a plan. A competent small team could build this without guessing.**
