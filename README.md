# Lumen-Orca: Precision Orchestration System

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/hwinnwin/Lumen-Orca?quickstart=1)
[![CI - Six-Nines Gate](https://github.com/hwinnwin/Lumen-Orca/actions/workflows/ci.yml/badge.svg)](https://github.com/hwinnwin/Lumen-Orca/actions/workflows/ci.yml)
[![Determinism](https://img.shields.io/badge/determinism-%3E99.99%25-success)]()
[![Mutation Score](https://img.shields.io/badge/mutation-%E2%89%A50.80-success)]()
[![Coverage](https://img.shields.io/badge/coverage-%E2%89%A595%25-success)]()
[![F_total](https://img.shields.io/badge/F__total-%E2%89%A410%E2%81%BB%E2%81%B6-critical)]()

**Status:** Phase I Complete ✅ | Phase II Implementation Ready 🚧  
**Target Reliability:** 99.9999% (Six-Nines Protocol)  
**Current Certification:** Governance Infrastructure ✅ | Autonomous Agents ⚠️ (Simulated)

---

## Overview

Lumen-Orca is an **autonomous build orchestration system** designed to achieve **six-nines reliability** (99.9999% success rate, F_total ≤ 10⁻⁶) through multi-agent coordination, comprehensive quality gates, and evidence-based governance.

### Core Principles
- **Precision**: Mathematical reliability guarantees through Six-Nines calculation
- **Autonomy**: Multi-agent DAG execution with self-verification
- **Transparency**: Evidence bundles for every orchestration run
- **Governance**: Contracts-first architecture with automated validation

📋 [**Operational Status**](docs/OPERATIONAL_STATUS.md) — Current system capabilities  
🔄 [**Phase II Transition**](docs/PHASE_II_TRANSITION.md) — Manual steps for autonomous agent readiness  
🚀 [**Phase II Setup Guide**](docs/PHASE_II_SETUP.md) — Agent implementation roadmap  
🏃 [**Run Issue Bootstrap**](../../actions/workflows/bootstrap-issues.yml) — One-click label + issue creation  
✅ [**Go/No-Go Gate Checklist**](docs/GO_NO_GO_CHECKLIST.md) — Pre-launch verification  
🔒 [**Branch Protection Setup**](docs/BRANCH_PROTECTION_SETUP.md) — Enforce quality gates on merge

📊 [**Evidence Bundle**](packages/evidence/dist/index.html) — Unit/Property/Mutation/Security/Performance + Contract Diff + SBOM

📘 [**Master Blueprint**](docs/blueprints/lumen_master_blueprint.md) — Architecture, agents, and governance model

## Quick Start

```bash
# Install dependencies
pnpm install

# Development (all packages in parallel)
pnpm dev             # or: pnpm dlx turbo run dev --parallel

# Build & validate
pnpm -r build
pnpm -r lint && pnpm -r typecheck

# Test suite
pnpm -r test:unit
pnpm -r test:property
pnpm -r test:mutation

# Quality assurance
pnpm -r qa:perf
pnpm -r qa:security

# Generate evidence bundle
pnpm -r evidence:bundle
```

You should see `packages/evidence/dist/index.html` attached by CI on PRs.

---

## 📊 Production Readiness Status

### ✅ Complete & Certified (Phase I)

#### 1. Governance Infrastructure ✅
- **Six-Nines Calculation**: `packages/qa/src/sixNines.ts` - F_total ≤ 1e-6 enforcement
- **Evidence Bundles**: Auto-generated HTML reports with quality gates
- **CI/CD Pipeline**: Matrix builds with status checks + six-nines gate
- **Grading System**: AAA/AA/A letter grades for all metrics
- **Contract Validation**: Schema enforcement via `packages/contracts`

#### 2. Multi-Provider LLM Infrastructure ✅
- **LLM Proxy**: `supabase/functions/llm-proxy/` with Anthropic, Google, OpenAI, Lovable-AI
- **Dynamic Routing**: Fallback handling, cost tracking, provider health monitoring
- **Database Tables**: `llm_configurations`, `llm_usage_logs`, `provider_health`, `budget_settings`
- **Settings Dashboard**: Provider configuration, budget alerts, usage monitoring

#### 3. User Authentication & Profiles ✅
- **Auth Methods**: Email/password + Google OAuth (configured)
- **Protected Routes**: Dashboard, agents, evidence access control
- **RLS Policies**: User-scoped data access + role-based permissions (admin/operator/viewer)
- **Agent Profiles**: Custom profiles with numerology presets

#### 4. Frontend Dashboard ✅
- **Metrics Panel**: Graded metrics (AAA/AA/A badges)
- **Agent Status Grid**: A0-A10 monitoring
- **Orchestration Graph**: DAG visualization
- **Evidence Browser**: Bundle viewing and download

---

### 🚧 Missing for Production (Phase II)

#### 1. Real Agent Implementation ⚠️ **BLOCKER**
**Current:** A0-A10 agents are **simulated** with mock tasks  
**Needed:**
- A1: LLM-driven spec analysis
- A2: Task decomposition logic
- A3: Contract validation engine
- A4-A9: Code analysis, QA, security scanning
- Real-time agent communication

**Impact:** Cannot achieve autonomous operation

---

#### 2. Code Analysis & Execution ⚠️ **BLOCKER**
**Current:** No real test execution, Stryker configured but not wired  
**Needed:**
- AST parsing for code understanding
- Vitest runner integration
- Stryker mutation testing automation
- Coverage collection from real runs
- fast-check property test generation

**Impact:** Cannot generate real evidence bundles

---

#### 3. Safety & Sandboxing 🔴 **CRITICAL**
**Current:** No isolation, no rollback  
**Needed:**
- Git-based rollback for failed changes
- Docker/VM sandboxing for agent execution
- Blast radius limiting
- Pre-flight validation
- Emergency stop mechanism

**Impact:** Unsafe for autonomous code modification

---

#### 4. Evidence Storage & Retrieval
**Current:** Evidence bundles in-memory only  
**Needed:**
- Supabase Storage bucket for artifacts
- Database table for bundle metadata
- Artifact upload/download API
- Retention policies

**Impact:** Evidence lost on refresh, no audit trail

---

## 🎯 Phase II Roadmap

### **II.A: Agent Core** (4-6 weeks)
1. Implement A1 (Spec Architect) with real LLM reasoning
2. Wire A2 (Planner) to decompose specs into tasks
3. Build A3 (Contract Guardian) with schema validation
4. Create agent execution sandbox with rollback

**Success Criteria:**
- A1-A3 autonomously generate specs, plans, contracts
- F_total ≤ 1e-6 maintained during agent runs
- Evidence bundles show real agent outputs

---

### **II.B: Quality Automation** (3-4 weeks)
1. Integrate Vitest for real coverage reporting
2. Wire Stryker mutation testing to CI
3. Implement property-based testing with fast-check
4. Create flake detection and retry logic

**Success Criteria:**
- Mutation score ≥ 80% enforced in CI
- Coverage ≥ 95% from real test execution
- Flake rate < 0.1% tracked in evidence
- Property tests discover edge cases

---

### **II.C: Self-Verifying DAGs** (2-3 weeks)
1. Build agent orchestration with dependency resolution
2. Implement task result validation and retry
3. Add agent disagreement RFC protocol
4. Create "swarm mode" for parallel execution

**Success Criteria:**
- A0 orchestrates A1-A10 without human intervention
- Failed tasks trigger automatic retries or RFC
- Evidence bundles auto-publish on success

---

### **II.D: Operational Hardening** (2-3 weeks)
1. Add monitoring/alerting for agent failures
2. Implement cost controls and budget enforcement
3. Create incident routing (A10) with escalation
4. Build audit log for all agent actions

**Success Criteria:**
- Provider health monitoring with auto-failover
- Budget alerts at 80% threshold
- Full audit trail for governance compliance

---

## 📈 Current Six-Nines Metrics

| Metric | Target | Current Status | Notes |
|--------|--------|----------------|-------|
| **F_total** | ≤ 1e-6 | ✅ Calculation Ready | Engine complete, needs real test data |
| **Mutation Score** | ≥ 80% | ⚠️ Infrastructure Ready | Stryker configured, not wired to CI |
| **Coverage** | ≥ 95% | ⚠️ Tracked but not enforced | Vitest configured, not in live CI |
| **Determinism** | ≥ 99.99% | ✅ Calculation Ready | Algorithm ready, needs test execution |
| **Flake Rate** | < 0.1% | ⚠️ Tracked in sixNines.ts | Not measured yet (no retry logic) |

**Overall Certification:**
- ✅ **Governance Infrastructure:** Production-ready
- ⚠️ **Autonomous Agents:** Demonstration-only (simulated)
- 🔴 **Quality Automation:** Incomplete (no real test execution)

---

## 🚀 Next Immediate Steps

### 1. Create Phase II GitHub Issues
**Script:** `scripts/create_phase_ii_issues.sh`  
**Target:** Create tracking issues for all A1-A10 agents  
**Templates:** See `docs/PHASE_II_SETUP.md`

### 2. Implement A1 Spec Architect
**Focus:** First real autonomous agent with LLM reasoning  
**Dependencies:** `llm-proxy` edge function (already deployed)  
**Deliverable:** `packages/agents/src/A1_spec_architect.ts`

### 3. Wire Vitest Test Execution
**Goal:** Generate real coverage reports  
**Integration Point:** `src/lib/evidence-service.ts`  
**Output:** JSON coverage artifacts in evidence bundles

### 4. Deploy Evidence Storage
**Platform:** Lovable Cloud (Supabase Storage)  
**Buckets:** `evidence-bundles`, `test-artifacts`  
**RLS Policies:** Users can view own evidence, admins view all

---

## 🏗️ Detailed Repository Structure

```
Lumen-Orca/
├── packages/
│   ├── agents/               # Agent implementations (A0-A10)
│   │   ├── src/
│   │   │   ├── A0_orchestrator.ts    # DAG coordinator (active)
│   │   │   ├── A1_spec_architect.ts  # Requirements agent (placeholder)
│   │   │   └── types.ts              # Agent interfaces
│   │   └── package.json
│   │
│   ├── contracts/            # Schema validation & enforcement
│   │   ├── schemas/entry.schema.json
│   │   ├── src/index.ts
│   │   └── tests/contract.spec.ts
│   │
│   ├── evidence/             # Bundle generation system
│   │   ├── src/bundle.ts     # Evidence aggregation & HTML rendering
│   │   └── package.json
│   │
│   ├── lumen-ui/             # Design system
│   │   ├── src/
│   │   │   ├── tokens.ts     # Design tokens
│   │   │   └── motion.ts     # Animation system
│   │   └── package.json
│   │
│   └── qa/                   # Quality assurance & Six-Nines
│       ├── src/
│       │   ├── sixNines.ts   # F_total calculation engine
│       │   ├── grading/      # AAA/AA/A grading system
│       │   ├── mutation.config.cjs
│       │   └── property.config.ts
│       └── scripts/verify-six-nines.js
│
├── src/                      # Frontend application
│   ├── components/
│   │   ├── agents/           # Agent management UI
│   │   ├── dashboard/        # Metrics & orchestration views
│   │   ├── demo/             # Demo presentation
│   │   ├── layout/           # Auth & navigation
│   │   ├── profile/          # User profiles & agent presets
│   │   └── ui/               # shadcn/ui components
│   │
│   ├── hooks/
│   │   ├── use-auth.tsx
│   │   ├── use-orchestrator.tsx
│   │   └── use-agent-profiles.tsx
│   │
│   ├── lib/
│   │   ├── agent-registry.ts         # Custom agent definitions
│   │   ├── evidence-service.ts       # Evidence bundle management
│   │   ├── orchestrator-service.ts   # DAG execution service
│   │   ├── grading.ts                # Metrics grading logic
│   │   └── utils.ts
│   │
│   ├── pages/
│   │   ├── Auth.tsx          # Login/signup (Google OAuth)
│   │   ├── Dashboard.tsx     # Main metrics dashboard
│   │   ├── Agents.tsx        # Agent management
│   │   ├── Evidence.tsx      # Evidence browser
│   │   └── Settings.tsx      # LLM & budget config
│   │
│   └── integrations/supabase/
│       ├── client.ts         # Auto-generated
│       └── types.ts          # Auto-generated
│
├── supabase/
│   ├── functions/
│   │   ├── llm-proxy/        # Multi-provider LLM routing
│   │   │   ├── index.ts      # Main proxy router
│   │   │   └── providers/    # Anthropic, Google, OpenAI, Lovable-AI
│   │   ├── track-activity/   # Usage logging
│   │   └── user-info/        # Profile endpoints
│   │
│   ├── migrations/           # Database schema (auto-managed)
│   └── config.toml           # Supabase configuration
│
├── docs/
│   ├── blueprints/lumen_master_blueprint.md
│   ├── epics/
│   ├── PHASE_II_SETUP.md
│   ├── PHASE_II_TRANSITION.md
│   ├── OPERATIONAL_STATUS.md
│   ├── FINALIZATION.md
│   ├── GO_NO_GO_CHECKLIST.md
│   ├── BRANCH_PROTECTION_SETUP.md
│   ├── GRADING_SYSTEM.md
│   └── LLM_PROVIDER_SYSTEM.md
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml            # Main CI pipeline
│   │   ├── release.yml
│   │   ├── bootstrap-issues.yml
│   │   └── agents/           # Agent workflow placeholders
│   │
│   ├── CODEOWNERS
│   └── pull_request_template.md
│
├── scripts/
│   ├── bootstrap_lumen_issues.sh
│   ├── create_phase_ii_issues.sh
│   └── smoke.sh
│
└── [config files]            # TypeScript, ESLint, Vite, Tailwind
```

---

## 🛠️ Technical Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** React Query (@tanstack/react-query)
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod validation

### Backend (Lovable Cloud / Supabase)
- **Database:** PostgreSQL with RLS policies
- **Auth:** Supabase Auth (email/password + Google OAuth)
- **Edge Functions:** Deno runtime
  - `llm-proxy`: Multi-provider LLM routing
  - `track-activity`: Usage logging
  - `user-info`: Profile management
- **Storage:** Supabase Storage (future: evidence artifacts)

### Quality Assurance
- **Testing:** Vitest (unit + integration)
- **Mutation Testing:** Stryker (@stryker-mutator/core)
- **Property Testing:** fast-check
- **Coverage:** Vitest coverage (v8 provider)
- **Linting:** ESLint + TypeScript strict mode

### CI/CD
- **Platform:** GitHub Actions
- **Matrix:** Ubuntu, macOS, Windows × Node 20, 22
- **Status Checks:** Contract validation, evidence verification, six-nines gate
- **Branch Protection:** Requires all checks + 1 review

### Monorepo Management
- **Package Manager:** pnpm (workspaces)
- **Build Orchestration:** Turbo
- **Workspaces:** agents, contracts, evidence, lumen-ui, qa

---

## 📚 Essential Documentation

### Priority Reading (Handover)
1. **[OPERATIONAL_STATUS.md](docs/OPERATIONAL_STATUS.md)** - Current capabilities and certification
2. **[PHASE_II_SETUP.md](docs/PHASE_II_SETUP.md)** - Agent implementation roadmap
3. **[lumen_master_blueprint.md](docs/blueprints/lumen_master_blueprint.md)** - System architecture
4. **[GRADING_SYSTEM.md](docs/GRADING_SYSTEM.md)** - AAA/AA/A grading thresholds
5. **[LLM_PROVIDER_SYSTEM.md](docs/LLM_PROVIDER_SYSTEM.md)** - Multi-provider routing

### Additional Resources
- **[PHASE_II_TRANSITION.md](docs/PHASE_II_TRANSITION.md)** - Manual transition checklist
- **[FINALIZATION.md](docs/FINALIZATION.md)** - Phase I verification
- **[GO_NO_GO_CHECKLIST.md](docs/GO_NO_GO_CHECKLIST.md)** - Pre-deployment validation
- **[BRANCH_PROTECTION_SETUP.md](docs/BRANCH_PROTECTION_SETUP.md)** - CI/CD enforcement

---

## 🔐 Security

### Row-Level Security (RLS) Policies
- **profiles:** Users view/update own profile only
- **user_roles:** Users view own roles, admins manage all
- **llm_configurations:** Public read, admin write
- **llm_usage_logs:** Public read (anonymized), system write
- **provider_health:** Public read, system write
- **budget_settings:** Admin read/write

### Authentication
- **Email/Password:** Supabase Auth with bcrypt hashing
- **Google OAuth:** Configured (client ID + secret required)
- **Session:** JWT tokens with auto-refresh
- **Protected Routes:** `ProtectedRoute.tsx` wrapper

### API Security
- **Edge Functions:** Supabase JWT validation
- **LLM Proxy:** API keys stored as Supabase secrets
- **Budget Enforcement:** Hard stop at 100% monthly budget
- **Rate Limiting:** Per-provider rate limits in `provider_health`

---

## 📊 Key Performance Indicators (KPIs)

### Primary Indicators (Six-Nines Protocol)
- **F_total:** ≤ 1e-6 (99.9999% reliability)
- **Build Time:** < 5 minutes (P95)
- **Flake Rate:** < 0.1%
- **Mutation Score:** ≥ 80%
- **Coverage:** ≥ 95%

### Secondary Indicators (Operational)
- **Agent Uptime:** ≥ 99.9%
- **LLM Latency:** < 2 seconds (P95)
- **Cost Per Run:** < $0.50 (target)
- **RFC Resolution Time:** < 1 hour (median)
- **Evidence Bundle Size:** < 10 MB (compressed)

---

## 🎯 Success Criteria (Production Deployment)

### Phase II Complete When:
- [ ] All A1-A10 agents implemented with real LLM reasoning
- [ ] Real test execution (Vitest + Stryker + fast-check) wired to CI
- [ ] Evidence bundles generated from actual test results
- [ ] Agent sandbox with rollback capability operational
- [ ] Self-verifying DAG execution without human intervention
- [ ] Monitoring, alerting, and incident routing (A10) active
- [ ] F_total ≤ 1e-6 maintained across all autonomous runs
- [ ] Audit log tracking all agent actions

### Deployment Readiness Gates
1. ✅ **Governance:** Six-Nines enforcement in CI
2. ⚠️ **Autonomy:** Real agents (not simulated)
3. ⚠️ **Quality:** Mutation ≥ 80%, Coverage ≥ 95%
4. 🔴 **Safety:** Sandbox + rollback operational
5. ⚠️ **Evidence:** Real artifacts stored and retrievable

**Current Status:** 1/5 gates passed (Governance only)

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **Agents are simulated** - A1-A10 do not perform real reasoning
2. **No real test execution** - Evidence bundles use mock data
3. **No mutation testing in CI** - Stryker configured but not automated
4. **No agent sandbox** - Unsafe for autonomous code modification
5. **No evidence storage** - Bundles lost on refresh
6. **No flake detection** - Retry logic not implemented
7. **No property testing** - fast-check configured but not wired

### Workarounds (Temporary)
- **Agent testing:** Use demo mode with simulated tasks
- **Evidence verification:** Manually run `verify-six-nines.js`
- **Mutation testing:** Run Stryker locally in `packages/qa`
- **Flake tracking:** Manually record flakes in evidence bundles

### Planned Fixes
See **Phase II Roadmap** sections II.A-II.D above

---

## 📞 Support & Escalation

### Repository
- **GitHub:** https://github.com/hwinnwin/Lumen-Orca
- **Issues:** https://github.com/hwinnwin/Lumen-Orca/issues
- **Discussions:** https://github.com/hwinnwin/Lumen-Orca/discussions

### Incident Escalation
- **P0 (Critical):** System down, data loss risk → Immediate
- **P1 (High):** Major feature broken → 1 hour
- **P2 (Medium):** Minor feature broken → 4 hours
- **P3 (Low):** Cosmetic issue → 1 day

---

## Project info

**Lovable URL**: https://lovable.dev/projects/fa2a1b8a-9faa-4f5f-9a09-960a15bc6bf6

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/fa2a1b8a-9faa-4f5f-9a09-960a15bc6bf6) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Architecture

**Monorepo structure**:
- `packages/agents` — A0-A10 agent implementations (orchestrator, spec, contracts, generator, test, etc.)
- `packages/contracts` — JSON schemas + golden fixtures + compatibility tests
- `packages/evidence` — Evidence bundle generation (HTML reports with all test artifacts)
- `packages/qa` — Mutation testing, property testing, six-nines calculation
- `packages/lumen-ui` — Design tokens + motion primitives
- `src/` — Dashboard UI (React + Vite + TypeScript + shadcn-ui + Tailwind CSS)

**Contracts-first rule**: All packages exchanging data import `@lumen/contracts`. PRs blocked if contract checks fail.

## Key Features

- **Six-Nines Gate**: F_total = 1 − Π(1 − Fᵢ) must be ≤ 10⁻⁶ for RC approval
- **Evidence Bundle**: Auto-generated HTML with unit/property/mutation/security/perf + contract diff + SBOM
- **Master Prompt**: YAML-based workflow definition for agent orchestration
- **Real-time Metrics**: Dashboard displays determinism, mutation score, coverage, flake rate, and F_total
- **Contract Validation**: Golden fixtures + compatibility tests for all data exchanges

## Governance & Contribution

- 📖 [**Contributing Guide**](CONTRIBUTING.md) — Agent Log format, quality gates, PR workflow
- ✅ [**Go/No-Go Checklist**](docs/GO_NO_GO_CHECKLIST.md) — Pre-launch verification
- 🔒 [**Branch Protection**](docs/BRANCH_PROTECTION_SETUP.md) — Enforcement & validation routine
- 📊 [**Finalization Guide**](docs/FINALIZATION.md) — Complete operationalization checklist
- 🏃 [**Run Issue Bootstrap**](../../actions/workflows/bootstrap-issues.yml) — One-click label/issue creation
- 📝 [**Create Example PR**](../../actions/workflows/create-example-pr.yml) — Generate canonical PR template

## Technologies

- **Frontend**: Vite, TypeScript, React, shadcn-ui, Tailwind CSS
- **Testing**: Vitest, fast-check (property), Stryker (mutation)
- **Build**: Turborepo, pnpm workspaces
- **CI/CD**: GitHub Actions with matrix builds (OS × Node versions)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/fa2a1b8a-9faa-4f5f-9a09-960a15bc6bf6) and click on Share -> Publish.

## Issue Management

Auto-create GitHub labels and issue structure (Epic → Stories → Tasks):

```bash
export GITHUB_TOKEN="ghp_xxx"  # repo scope
export OWNER="org-or-user"
export REPO="lumen-sentinel-nexus"
bash scripts/bootstrap_lumen_issues.sh
```

See [scripts/README.md](scripts/README.md) for details.

## Acceptance Criteria (Setup PR)

- ✅ Contracts package present and imported by UI & agents
- ✅ Matrix CI green with evidence upload
- ✅ Metrics panel shows F_total, determinism, mutation, coverage, flake
- ✅ Master Blueprint linked; PR uses Agent Log template
- ✅ Labels + issue templates exist (or script ready to create them)

## Deployment

Simply open [Lovable](https://lovable.dev/projects/fa2a1b8a-9faa-4f5f-9a09-960a15bc6bf6) and click on Share → Publish.

## Custom Domain

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
