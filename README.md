# Lumen-Orca: Autonomous Build Orchestration System

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/hwinnwin/Lumen-Orca?quickstart=1)
[![CI - Six-Nines Gate](https://github.com/hwinnwin/Lumen-Orca/actions/workflows/ci.yml/badge.svg)](https://github.com/hwinnwin/Lumen-Orca/actions/workflows/ci.yml)
[![Determinism](https://img.shields.io/badge/determinism-%3E99.99%25-success)]()
[![Mutation Score](https://img.shields.io/badge/mutation-%E2%89%A50.80-success)]()
[![Coverage](https://img.shields.io/badge/coverage-%E2%89%A595%25-success)]()
[![F_total](https://img.shields.io/badge/F__total-%E2%89%A410%E2%81%BB%E2%81%B6-critical)]()

**Status:** Phase I Complete ✅ | Phase II Implementation Ready 🚧  
**Target Reliability:** 99.9999% (Six-Nines Protocol)  
**Production Domain:** https://lumenorca.app/  
**GitHub Repository:** https://github.com/hwinnwin/Lumen-Orca

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [System Diagnostic Summary](#-system-diagnostic-summary)
- [Project Structure Deep Dive](#-project-structure-deep-dive)
- [Feature Inventory](#-feature-inventory)
- [Authentication & User System](#-authentication--user-system)
- [Database & Backend State](#-database--backend-state)
- [Frontend State & Navigation](#-frontend-state--navigation)
- [Schema & API Mapping](#-schema--api-mapping)
- [Gaps & Inconsistencies](#-gaps--inconsistencies)
- [Integration Readiness](#-integration-readiness)
- [Development Health Assessment](#-development-health-assessment)
- [Recommended Next Steps](#-recommended-next-steps)
- [Quick Start Guide](#-quick-start-guide)
- [Technical Stack](#-technical-stack)
- [Security Architecture](#-security-architecture)
- [Support & Escalation](#-support--escalation)

---

## 🎯 Project Overview

Lumen-Orca is an **autonomous build orchestration system** designed to achieve **six-nines reliability** (99.9999% success rate, F_total ≤ 10⁻⁶) through multi-agent coordination, comprehensive quality gates, and evidence-based governance.

### Core Principles
- **Precision**: Mathematical reliability guarantees through Six-Nines calculation
- **Autonomy**: Multi-agent DAG execution with self-verification
- **Transparency**: Evidence bundles for every orchestration run
- **Governance**: Contracts-first architecture with automated validation

### Key Links
📋 [**Operational Status**](docs/OPERATIONAL_STATUS.md) — Current system capabilities  
🚀 [**Phase II Setup Guide**](docs/PHASE_II_SETUP.md) — Agent implementation roadmap  
📘 [**Master Blueprint**](docs/blueprints/lumen_master_blueprint.md) — Architecture & governance model  
📊 [**Evidence Bundle**](packages/evidence/dist/index.html) — Quality gate artifacts  
🔒 [**Branch Protection Setup**](docs/BRANCH_PROTECTION_SETUP.md) — CI/CD enforcement

---

## 🔍 System Diagnostic Summary

### Current Certification Status

| Component | Status | Details |
|-----------|--------|---------|
| **Governance Infrastructure** | ✅ Production Ready | Six-Nines calculation, evidence bundles, CI/CD gates, grading system |
| **LLM Infrastructure** | ✅ Production Ready | Multi-provider proxy, routing, cost tracking, budget management |
| **Authentication & Profiles** | ✅ Production Ready | Email/password, Google OAuth, MFA, RBAC, agent profiles |
| **Frontend Dashboard** | ✅ Production Ready | Metrics, orchestration graph, agent monitoring |
| **Agent Execution** | ⚠️ **SIMULATED** | A0-A10 agents are mocked, no real LLM reasoning |
| **Code Analysis** | ⚠️ **INCOMPLETE** | No real test execution, Stryker not wired |
| **Safety & Sandboxing** | 🔴 **MISSING** | No isolation, no rollback capability |
| **Evidence Storage** | ⚠️ **IN-MEMORY ONLY** | No persistent storage, artifacts lost on refresh |

### Production Readiness: 40% Complete

**Ready for Production:**
- ✅ Governance infrastructure (Six-Nines engine, grading, contracts)
- ✅ Multi-provider LLM system with fallback handling
- ✅ User authentication with RLS and RBAC
- ✅ Dashboard UI with metrics visualization

**Blockers for Production:**
- 🔴 Agents are simulated (A1-A10 don't execute real tasks)
- 🔴 No code execution sandbox
- 🔴 No real test execution or evidence generation
- 🔴 No persistent evidence storage

### Estimated Timeline to Production
- **Agent Core Implementation:** 4-6 weeks
- **Quality Automation:** 3-4 weeks
- **Self-Verifying DAGs:** 2-3 weeks
- **Operational Hardening:** 2-3 weeks
- **Total:** ~12-16 weeks (3-4 months)

---

## 🏗️ Project Structure Deep Dive

### Directory Architecture

```
Lumen-Orca/
├── packages/                    # Monorepo workspaces (Turborepo + pnpm)
│   ├── agents/                  # Agent implementations (A0-A10)
│   │   ├── src/
│   │   │   ├── A0_orchestrator.ts    # ✅ DAG coordinator (working)
│   │   │   ├── A1_spec_architect.ts  # ⚠️ Placeholder (simulated)
│   │   │   └── types.ts              # Agent interfaces
│   │   └── package.json
│   │
│   ├── contracts/               # JSON Schema validation
│   │   ├── schemas/entry.schema.json
│   │   ├── src/index.ts         # Schema validators
│   │   └── tests/contract.spec.ts
│   │
│   ├── evidence/                # Bundle generation
│   │   ├── src/bundle.ts        # ⚠️ HTML renderer (mock data)
│   │   └── package.json
│   │
│   ├── lumen-ui/                # Design system
│   │   ├── src/
│   │   │   ├── tokens.ts        # Design tokens
│   │   │   └── motion.ts        # Animation primitives
│   │   └── package.json
│   │
│   └── qa/                      # Six-Nines quality assurance
│       ├── src/
│       │   ├── sixNines.ts      # ✅ F_total calculation engine
│       │   ├── grading/         # AAA/AA/A grading system
│       │   ├── mutation.config.cjs
│       │   └── property.config.ts
│       └── scripts/verify-six-nines.js
│
├── src/                         # Frontend application (React + Vite)
│   ├── components/
│   │   ├── agents/              # Agent management UI
│   │   ├── auth/                # MFA enrollment/verification
│   │   ├── dashboard/           # Metrics, orchestration, execution monitor
│   │   ├── demo/                # Demo presentation
│   │   ├── layout/              # DashboardLayout, Sidebar, ProtectedRoute
│   │   ├── profile/             # Agent profiles, numerology presets
│   │   └── ui/                  # 44 shadcn/ui components
│   │
│   ├── hooks/
│   │   ├── use-auth.tsx         # ✅ Auth context provider
│   │   ├── use-orchestrator.tsx # DAG execution hook
│   │   └── use-agent-profiles.tsx
│   │
│   ├── lib/
│   │   ├── agent-registry.ts    # Custom agent definitions (localStorage)
│   │   ├── agent-llm-integration.ts  # ⚠️ Agent-LLM bridge (partial)
│   │   ├── execution-engine.ts  # 🔴 Sandbox executor (not implemented)
│   │   ├── evidence-service.ts  # Evidence bundle manager
│   │   ├── orchestrator-service.ts   # DAG execution service
│   │   ├── grading.ts           # Metrics grading logic
│   │   ├── audit-logger.ts      # Audit event logging
│   │   └── rate-limit.ts        # Rate limiting utilities
│   │
│   ├── pages/
│   │   ├── Auth.tsx             # ✅ Login/signup (email + Google OAuth)
│   │   ├── Dashboard.tsx        # ✅ Main metrics dashboard
│   │   ├── Agents.tsx           # ✅ Agent management
│   │   ├── Prompt.tsx           # ✅ Workflow execution UI
│   │   ├── Evidence.tsx         # ✅ Evidence browser
│   │   ├── Settings.tsx         # ✅ LLM providers, API keys, budgets
│   │   ├── Profile.tsx          # ✅ Agent profiles & numerology
│   │   ├── AuditLogs.tsx        # ✅ Security audit log viewer
│   │   ├── RateLimitManagement.tsx   # ✅ Rate limit configuration
│   │   ├── UserGuide.tsx        # ⚠️ Empty placeholder
│   │   ├── SystemLogs.tsx       # ⚠️ Empty placeholder
│   │   └── Telemetry.tsx        # ⚠️ Partial metrics
│   │
│   └── integrations/supabase/
│       ├── client.ts            # ✅ Auto-generated Supabase client
│       └── types.ts             # ✅ Auto-generated TypeScript types
│
├── supabase/                    # Lovable Cloud (Supabase) backend
│   ├── functions/               # Edge Functions (Deno runtime)
│   │   ├── llm-proxy/           # ✅ Multi-provider LLM routing
│   │   │   ├── index.ts         # Main router with fallback logic
│   │   │   └── providers/       # Anthropic, Google, OpenAI, Lovable-AI
│   │   ├── execute-code/        # 🔴 Code execution (not sandboxed)
│   │   ├── track-activity/      # Usage logging
│   │   ├── check-rate-limit/    # Rate limiting enforcement
│   │   └── user-info/           # Profile endpoints
│   │
│   ├── migrations/              # Database schema (auto-managed)
│   └── config.toml              # Supabase configuration
│
├── nomforge/                    # Vietnamese Chữ Nôm translation prototype
│   ├── api/main.py              # FastAPI service
│   ├── forge/                   # Language utilities
│   ├── lexicon/                 # Core lexica
│   └── render/                  # SVG templates
│
├── docs/
│   ├── blueprints/lumen_master_blueprint.md
│   ├── epics/                   # YAML epic definitions
│   ├── PHASE_II_SETUP.md        # Agent implementation guide
│   ├── PHASE_II_TRANSITION.md   # Manual transition checklist
│   ├── OPERATIONAL_STATUS.md    # Current capabilities
│   ├── FINALIZATION.md          # Phase I verification
│   ├── GO_NO_GO_CHECKLIST.md    # Pre-deployment validation
│   ├── GRADING_SYSTEM.md        # AAA/AA/A thresholds
│   ├── LLM_PROVIDER_SYSTEM.md   # Multi-provider routing
│   └── USER_AUTH_AND_PROFILES.md
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml               # ✅ Matrix CI (OS × Node versions)
│   │   ├── release.yml
│   │   ├── bootstrap-issues.yml
│   │   └── agents/              # Agent workflow placeholders
│   │
│   ├── CODEOWNERS
│   └── pull_request_template.md
│
└── scripts/
    ├── bootstrap_lumen_issues.sh
    ├── create_phase_ii_issues.sh
    └── smoke.sh                 # Full test pipeline
```

### Package Dependencies

```
lumen-orca (root)
├── @lumen/agents     → @lumen/contracts
├── @lumen/contracts  → (standalone)
├── @lumen/evidence   → @lumen/contracts, @lumen/qa
├── @lumen/qa         → @lumen/contracts
└── @lumen/lumen-ui   → (standalone)
```

---

## 📦 Feature Inventory

### ✅ Fully Implemented Features

#### 1. User Authentication & Authorization
- **Email/Password Auth**: Supabase Auth with bcrypt hashing
- **Google OAuth**: Configured (requires client ID + secret)
- **Multi-Factor Authentication (MFA)**: TOTP-based (QR code enrollment)
- **Role-Based Access Control (RBAC)**: 
  - `admin` - Full system access
  - `developer` - Can manage agents and configurations
  - `viewer` - Read-only access
- **Protected Routes**: `ProtectedRoute.tsx` wrapper for auth gates
- **Session Management**: JWT tokens with auto-refresh

#### 2. Security Infrastructure
- **Audit Logging**: Comprehensive event tracking
  - Authentication events (login, signup, MFA enrollment)
  - Role changes and permission updates
  - CSV export for compliance reporting
- **Rate Limiting**: Configurable endpoint protection
  - Login attempts: 5 per 15 minutes
  - Signup attempts: 10 per 60 minutes
  - MFA attempts: 3 per 15 minutes
  - Automatic IP blocking
- **Row-Level Security (RLS)**: Postgres policies on all tables
- **API Key Management**: Secure secrets storage in Supabase Vault

#### 3. Multi-Provider LLM System
- **LLM Proxy Edge Function**: `supabase/functions/llm-proxy/`
  - Lovable AI (primary, no API key required)
  - OpenAI (configured, API key stored)
  - Anthropic Claude (configured, API key not set)
  - Google AI (configured, API key not set)
- **Automatic Fallback**: Provider health monitoring with failover
- **Cost Tracking**: Token usage logging per agent/task
- **Budget Management**: Monthly budgets with alerts at 80% threshold
- **Settings Dashboard**: Provider configuration, API key status, budget monitoring

#### 4. Agent Profile System
- **Custom Agent Profiles**: User-defined agent personas
- **Numerology Presets**: 12 built-in profiles (1-9, 11, 22, 33, 44)
  - Each with specific traits, color schemes, system prompts
- **Profile Switching**: Quick switch between user and agent modes
- **localStorage Persistence**: Custom agents stored client-side
- **Max Agents**: 100 total (configurable via `MAX_AGENTS` constant)

#### 5. Dashboard & Monitoring
- **Metrics Panel**: 
  - F_total calculation with AAA/AA/A grading
  - Mutation score, coverage, determinism, flake rate
  - Real-time metrics with trend indicators
- **Agent Status Grid**: A0-A10 monitoring with health indicators
- **Orchestration Graph**: DAG visualization with task dependencies
- **Execution Monitor**: Real-time task execution tracking
- **Grade Badges**: Visual AAA/AA/A badges for metrics

#### 6. Evidence & Quality Gates
- **Evidence Bundle Generation**: HTML report generation
- **Six-Nines Calculation Engine**: `packages/qa/src/sixNines.ts`
- **Grading System**: AAA/AA/A thresholds for all metrics
- **Contract Validation**: JSON Schema enforcement

#### 7. Workflow Execution
- **Prompt Page**: Workflow manifest input
  - Auto-execute toggle (default: OFF for manual review)
  - Execution output preview section
  - YAML/JSON/Markdown/Natural language support
- **Workflow Validation**:
  - Missing dependency detection
  - Circular reference detection (DFS)
  - Invalid structure checks
- **Manual/Auto Modes**: User control over execution

#### 8. Reusable UI Components (44 total)
Full shadcn/ui component library:
- Forms: Input, Textarea, Select, Checkbox, Radio, Switch, Slider
- Navigation: Tabs, Accordion, Breadcrumb, Menubar, Navigation Menu
- Overlays: Dialog, Sheet, Drawer, Popover, Tooltip, Alert Dialog
- Feedback: Toast, Alert, Progress, Skeleton
- Data Display: Table, Card, Avatar, Badge, Separator
- Layout: Resizable, Scroll Area, Aspect Ratio, Collapsible
- Advanced: Calendar, Carousel, Chart, Command, Context Menu

---

### ⚠️ Partially Implemented Features

#### 1. Agent Orchestration
**What Exists:**
- A0 Orchestrator DAG coordinator (`packages/agents/src/A0_orchestrator.ts`)
- Agent registry system (`src/lib/agent-registry.ts`)
- Task dependency resolution
- Basic state management

**What's Missing:**
- A1-A10 agents are **simulated** (no real LLM reasoning)
- No agent-to-agent communication
- No real task execution
- No adjudication logic (A5)
- Mock sample tasks in `orchestrator-service.ts`

#### 2. Code Execution
**What Exists:**
- Edge function endpoint (`supabase/functions/execute-code/`)
- Basic code execution framework
- Timeout handling

**What's Missing:**
- **NO SANDBOXING** (critical security risk)
- No resource limits (CPU, memory, disk)
- No rollback capability
- No isolation (runs in main process)
- Not safe for autonomous agent use

#### 3. Evidence Bundles
**What Exists:**
- Bundle generation service (`src/lib/evidence-service.ts`)
- HTML report rendering (`packages/evidence/src/bundle.ts`)
- Evidence browser UI (`src/pages/Evidence.tsx`)

**What's Missing:**
- **Uses mock data only** (no real test results)
- No persistent storage (artifacts lost on refresh)
- No Supabase Storage integration
- No evidence retrieval API
- No artifact retention policies

#### 4. Workflow Validation
**What Exists:**
- Dependency validation (missing tasks, circular refs)
- Structure validation (required fields)
- Error blocking before execution

**What's Missing:**
- No schema validation against contracts
- No type checking for task inputs/outputs
- No runtime validation during execution

#### 5. Contract System
**What Exists:**
- JSON Schema definitions (`packages/contracts/schemas/`)
- Contract validation utilities
- Contract tests (`packages/contracts/tests/`)

**What's Missing:**
- Not enforced in CI
- No automatic contract diff generation
- No breaking change detection
- Not integrated into agent workflows

#### 6. Telemetry
**What Exists:**
- Telemetry page (`src/pages/Telemetry.tsx`)
- Basic metrics display

**What's Missing:**
- No real-time data streaming
- No historical data storage
- No charting/visualization
- Placeholder content only

---

### 🔴 Planned But Not Built

#### 1. Real Agent Execution
- **A1 Spec Architect**: LLM-driven requirement analysis
- **A2 Planner**: Task decomposition and planning
- **A3 Contract Guardian**: Schema validation and enforcement
- **A4 Generator (Path A)**: Code generation
- **A6 Tester**: Automated test generation and execution
- **A7 Benchmarker**: Performance testing
- **A8 Documenter**: Auto-documentation
- **A9 Security Scanner**: Vulnerability detection
- **A10 Incident Router**: Error handling and escalation

**Blocker:** All agents currently return mock data

#### 2. Code Analysis
- AST parsing for code understanding
- Vitest runner integration
- Stryker mutation testing automation
- Coverage collection from real runs
- fast-check property test generation

**Blocker:** No real test execution pipeline

#### 3. Self-Verifying DAGs
- Agent disagreement RFC protocol
- Automatic retry logic
- "Swarm mode" for parallel execution
- Task result validation
- Real-time agent communication

**Blocker:** Depends on real agent implementation

#### 4. Evidence Auto-Generation
- Real test result collection
- SBOM generation
- Contract diff automation
- Performance metrics collection
- Security scan results

**Blocker:** Depends on real test execution

#### 5. Provider Health Monitoring
- Health check endpoints for all LLM providers
- Automatic provider rotation on failure
- Latency tracking
- Success rate monitoring
- Alert system for provider outages

**Status:** Database table exists but not actively monitored

#### 6. Adjudicator (A5)
- Dual path execution (A4 Generator Path A vs Path B)
- Result comparison and validation
- Conflict resolution logic
- Voting mechanism for best output

**Blocker:** Depends on real agent execution

---

## 🔐 Authentication & User System

### Authentication Methods

1. **Email/Password**
   - Supabase Auth with bcrypt hashing
   - Email confirmation (auto-confirm enabled for dev)
   - Password reset flow
   - Session persistence via JWT

2. **Google OAuth**
   - Configured in Supabase Auth
   - Requires: Client ID + Client Secret
   - Automatic profile creation on first login
   - Avatar URL sync from Google

3. **Multi-Factor Authentication (MFA)**
   - TOTP-based (Time-based One-Time Password)
   - QR code enrollment flow
   - Backup codes (not yet implemented)
   - Required for admin users

### User Roles & Permissions

```typescript
enum AppRole {
  admin = "admin",       // Full system access
  developer = "developer", // Manage agents, view metrics
  viewer = "viewer"       // Read-only access
}
```

**Permission Matrix:**

| Feature | Admin | Developer | Viewer |
|---------|-------|-----------|--------|
| View Dashboard | ✅ | ✅ | ✅ |
| Manage Agents | ✅ | ✅ | ❌ |
| Execute Workflows | ✅ | ✅ | ❌ |
| View Evidence | ✅ | ✅ | ✅ |
| LLM Configuration | ✅ | ❌ | ❌ |
| Budget Settings | ✅ | ❌ | ❌ |
| User Management | ✅ | ❌ | ❌ |
| Audit Logs | ✅ | ❌ | ❌ |
| Rate Limit Config | ✅ | ❌ | ❌ |

### User Data Flow

```
auth.users (Supabase Auth)
    ↓
profiles (public.profiles)
    ├── id (FK to auth.users)
    ├── email
    ├── full_name
    ├── avatar_url
    └── last_seen
    ↓
user_roles (public.user_roles)
    ├── user_id (FK to auth.users)
    └── role (admin|developer|viewer)
```

### User Lifecycle

1. **Signup**: User creates account
   - `auth.users` record created by Supabase
   - Trigger `handle_new_user()` fires
   - `profiles` record auto-created
   - Default `viewer` role assigned in `user_roles`

2. **Login**: User authenticates
   - JWT token issued with 1-hour expiry
   - Session auto-refreshes on activity
   - `last_seen` timestamp updated
   - Audit log entry created

3. **Role Assignment**: Admin promotes user
   - Admin updates `user_roles` table
   - New permissions take effect immediately
   - Audit log entry created

4. **MFA Enrollment** (Admin users)
   - QR code generated with TOTP secret
   - User scans with authenticator app
   - MFA factors stored in `auth.mfa_factors`
   - Required on next login

### Authentication Hooks

**Frontend: `src/hooks/use-auth.tsx`**
```typescript
const { user, session, roles, isAdmin, isDeveloper, signOut } = useAuth();
```

**Backend: `src/lib/auth.ts`**
- `signInWithEmail()`
- `signInWithGoogle()`
- `signUpWithEmail()`
- `signOut()`
- `updateLastSeen()`
- `getUserRoles()`
- `hasRole()`

### Protected Routes

All dashboard routes wrapped in `ProtectedRoute`:
```tsx
<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
```

Redirects to `/auth` if not authenticated.

---

## 💾 Database & Backend State

### Supabase Tables

#### 1. `profiles` (User data)
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,  -- FK to auth.users
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
**RLS Policies:**
- Users can view/update own profile only
- Trigger `handle_profile_update()` on UPDATE

**CRUD Status:** ✅ Full CRUD via Supabase client

---

#### 2. `user_roles` (Authorization)
```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- FK to auth.users
  role app_role NOT NULL,  -- ENUM: admin|developer|viewer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
**RLS Policies:**
- Users can view own roles
- Admins can manage all roles (via `has_role()` function)

**CRUD Status:** ✅ Full CRUD (admin-only write)

---

#### 3. `llm_configurations` (LLM provider settings)
```sql
CREATE TABLE public.llm_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_role TEXT,  -- e.g., "spec_architect", "tester"
  provider TEXT NOT NULL,  -- "lovable-ai" | "openai" | "anthropic" | "google"
  model TEXT NOT NULL,
  fallback_provider TEXT,
  fallback_model TEXT,
  max_tokens INTEGER DEFAULT 4096,
  temperature NUMERIC DEFAULT 0.7,
  cache_ttl_seconds INTEGER DEFAULT 3600,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
**RLS Policies:**
- Admins can view/insert/update/delete (via `has_role()`)

**CRUD Status:** ✅ Full CRUD (admin-only)

---

#### 4. `llm_usage_logs` (Token usage tracking)
```sql
CREATE TABLE public.llm_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_role TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  task_id TEXT,
  tokens_input INTEGER NOT NULL,
  tokens_output INTEGER NOT NULL,
  estimated_cost NUMERIC NOT NULL,
  latency_ms INTEGER NOT NULL,
  cache_hit BOOLEAN DEFAULT FALSE,
  prompt_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
**RLS Policies:**
- Admins can view/insert/update/delete

**CRUD Status:** ✅ Full CRUD (admin-only)

---

#### 5. `provider_health` (LLM provider monitoring)
```sql
CREATE TABLE public.provider_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'healthy',  -- "healthy" | "degraded" | "down"
  last_success_at TIMESTAMP WITH TIME ZONE,
  last_failure_at TIMESTAMP WITH TIME ZONE,
  consecutive_failures INTEGER DEFAULT 0,
  avg_latency_ms INTEGER,
  success_rate NUMERIC,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
**RLS Policies:**
- Admins can view/insert/update/delete

**CRUD Status:** ⚠️ **Table exists but not actively populated**

---

#### 6. `budget_settings` (LLM cost management)
```sql
CREATE TABLE public.budget_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  monthly_budget NUMERIC NOT NULL,
  current_spend NUMERIC DEFAULT 0.00,
  alert_threshold NUMERIC DEFAULT 0.80,  -- 80%
  reset_date DATE NOT NULL,
  alerts_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
**RLS Policies:**
- Admins can view/insert/update/delete

**CRUD Status:** ✅ Full CRUD (admin-only)

**Database Function:**
```sql
CREATE FUNCTION increment_provider_spend(p_provider TEXT, p_amount NUMERIC)
```

---

#### 7. `audit_logs` (Security event tracking)
```sql
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,  -- FK to auth.users
  user_email TEXT,
  event_type TEXT NOT NULL,  -- "auth_login", "auth_signup", "mfa_enroll", etc.
  event_status TEXT NOT NULL,  -- "success" | "failure"
  event_details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
**RLS Policies:**
- Service role can insert (via edge functions)
- Admins can view

**CRUD Status:** ✅ Insert (system), Read (admin)

**Database Function:**
```sql
CREATE FUNCTION cleanup_old_audit_logs()  -- Deletes logs > 1 year
```

---

#### 8. `rate_limit_config` (Rate limiting rules)
```sql
CREATE TABLE public.rate_limit_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL UNIQUE,
  max_attempts INTEGER DEFAULT 5,
  window_minutes INTEGER DEFAULT 15,
  block_duration_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
**RLS Policies:**
- Admins can view/update

**CRUD Status:** ✅ Read/Update (admin-only)

---

#### 9. `rate_limit_attempts` (Rate limit tracking)
```sql
CREATE TABLE public.rate_limit_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  attempts INTEGER DEFAULT 1,
  first_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
**RLS Policies:**
- Admins can manage all
- Admins can view

**CRUD Status:** ✅ Full CRUD (admin-only)

**Database Function:**
```sql
CREATE FUNCTION cleanup_rate_limit_attempts()  -- Deletes > 7 days old
```

---

### Database Functions

```sql
-- Role checking
CREATE FUNCTION has_role(_user_id UUID, _role app_role) RETURNS BOOLEAN

-- User profile management
CREATE FUNCTION handle_new_user() RETURNS TRIGGER  -- Creates profile + viewer role
CREATE FUNCTION handle_profile_update() RETURNS TRIGGER  -- Updates updated_at

-- Budget management
CREATE FUNCTION increment_provider_spend(p_provider TEXT, p_amount NUMERIC) RETURNS VOID

-- Cleanup jobs
CREATE FUNCTION cleanup_old_audit_logs() RETURNS VOID
CREATE FUNCTION cleanup_rate_limit_attempts() RETURNS VOID
```

---

### Edge Functions (Supabase Functions / Deno)

#### 1. `llm-proxy` (Multi-provider LLM routing) ✅
**Path:** `supabase/functions/llm-proxy/`

**Purpose:** Route LLM requests to multiple providers with fallback

**Providers:**
- `lovable-ai` (primary, no API key required)
- `openai` (configured, API key stored)
- `anthropic` (configured, no API key)
- `google` (configured, no API key)

**Features:**
- Automatic fallback on provider failure
- Token usage logging
- Cost estimation
- Budget enforcement
- Rate limiting per provider

**Request:**
```typescript
POST /llm-proxy
{
  "provider": "lovable-ai",
  "model": "gpt-4",
  "messages": [...],
  "temperature": 0.7,
  "max_tokens": 4096
}
```

**Response:**
```typescript
{
  "choices": [...],
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 50,
    "total_tokens": 150
  },
  "estimated_cost": 0.0015
}
```

---

#### 2. `execute-code` (Code execution) 🔴 **NOT SANDBOXED**
**Path:** `supabase/functions/execute-code/`

**Purpose:** Execute agent-generated code

**Security Status:** ❌ **UNSAFE - NO ISOLATION**

**What's Missing:**
- No sandboxing
- No resource limits
- No rollback capability
- Runs in main Deno process

**Blocker:** Cannot use for autonomous agents

---

#### 3. `track-activity` (Usage logging) ✅
**Path:** `supabase/functions/track-activity/`

**Purpose:** Log user activity and LLM usage

**Logs to:**
- `llm_usage_logs` table
- `provider_health` table (future)

---

#### 4. `check-rate-limit` (Rate limiting) ✅
**Path:** `supabase/functions/check-rate-limit/`

**Purpose:** Enforce rate limits on endpoints

**Features:**
- IP-based rate limiting
- Configurable thresholds
- Automatic IP blocking
- Cleanup of old attempts

---

#### 5. `user-info` (Profile management) ✅
**Path:** `supabase/functions/user-info/`

**Purpose:** User profile CRUD operations

**Endpoints:**
- GET `/user-info` - Get current user profile
- PUT `/user-info` - Update profile

---

### Active Integrations

| Integration | Status | Details |
|-------------|--------|---------|
| **Lovable Cloud (Supabase)** | ✅ Active | Database, Auth, Edge Functions, Storage (future) |
| **Lovable AI** | ✅ Active | Primary LLM provider (no API key required) |
| **OpenAI** | ✅ Configured | API key stored, fallback provider |
| **Anthropic Claude** | ⚠️ Configured | No API key set |
| **Google AI** | ⚠️ Configured | No API key set |
| **Stripe** | ❌ Not Integrated | Payment processing |
| **Email Service** | ❌ Not Integrated | Notification emails |
| **Storage Buckets** | ❌ Not Created | File upload/download |

---

### Missing Database Components

1. **No `agent_tasks` table** - Task definitions stored in memory only
2. **No `execution_logs` table** - Execution history not persisted
3. **No `workflow_definitions` table** - Workflows not stored in DB
4. **No Storage Buckets** - Evidence artifacts, user uploads
5. **No `provider_health` monitoring** - Table exists but not populated

---

## 🎨 Frontend State & Navigation

### Live Pages (Fully Functional)

| Route | Component | Features | Auth Required |
|-------|-----------|----------|---------------|
| `/` | `Index.tsx` | Landing page, demo auto-login | No |
| `/auth` | `Auth.tsx` | Login, signup, Google OAuth | No |
| `/mfa-setup` | `MfaSetup.tsx` | MFA enrollment with QR code | Yes (Admin) |
| `/dashboard` | `Dashboard.tsx` | Metrics panel, graded badges | Yes |
| `/agents` | `Agents.tsx` | Agent status grid, add agents | Yes |
| `/prompt` | `Prompt.tsx` | Workflow execution UI | Yes |
| `/evidence` | `Evidence.tsx` | Evidence bundle browser | Yes |
| `/contracts` | `Contracts.tsx` | Contract viewer | Yes |
| `/settings` | `Settings.tsx` | LLM providers, API keys, budgets | Yes (Admin) |
| `/profile` | `Profile.tsx` | Agent profiles, numerology presets | Yes |
| `/audit-logs` | `AuditLogs.tsx` | Security audit log viewer, CSV export | Yes (Admin) |
| `/rate-limit` | `RateLimitManagement.tsx` | Rate limit configuration | Yes (Admin) |
| `/telemetry` | `Telemetry.tsx` | Real-time metrics (partial) | Yes |

---

### Empty/Placeholder Pages

| Route | Component | Status | Reason |
|-------|-----------|--------|--------|
| `/user-guide` | `UserGuide.tsx` | ⚠️ Empty | Documentation not written |
| `/system-logs` | `SystemLogs.tsx` | ⚠️ Empty | Log viewing not implemented |
| `/demo-plan` | `DemoPlan.tsx` | ⚠️ Partial | Placeholder content only |

---

### Navigation Structure

**Main Sidebar (Authenticated):**
```
Dashboard
├── Overview (Dashboard)
├── Agents
├── Prompt (Workflow Execution)
├── Evidence
├── Contracts
└── Telemetry

Settings
├── Profile
├── Settings (LLM, API Keys, Budgets)
├── Audit Logs
└── Rate Limit Management

Resources
├── User Guide (empty)
└── System Logs (empty)
```

**Public Routes:**
```
/ (Landing)
/auth (Login/Signup)
```

**Component Tree:**
```
App.tsx
├── AuthProvider (use-auth.tsx)
│   └── Router
│       ├── Index (/)
│       ├── Auth (/auth)
│       └── ProtectedRoute (all authenticated routes)
│           └── DashboardLayout
│               ├── Sidebar
│               └── [Page Content]
```

---

### State Management

**Global State:**
- **Auth:** `useAuth()` hook via Context API
  - User object, session, roles
  - `isAdmin`, `isDeveloper` flags
  - `signOut()` function

- **Orchestrator:** `useOrchestrator()` hook
  - Task list, agent statuses
  - DAG state, execution history
  - Not persisted (in-memory only)

- **Agent Profiles:** `useAgentProfiles()` hook
  - Custom agent definitions
  - Stored in `localStorage`
  - Max 100 agents

**Local State:**
- React Query for async data (Supabase queries)
- `useState` for component-level state
- Form state via `react-hook-form`

**Persistence:**
- ✅ **Database**: User profiles, roles, LLM configs
- ✅ **localStorage**: Agent profiles, custom agents
- ❌ **No persistence**: Tasks, workflows, execution history, evidence bundles

---

### UI Component Library

**44 shadcn/ui components available:**

**Forms:**
- `Input`, `Textarea`, `Select`, `Checkbox`, `Radio Group`
- `Switch`, `Slider`, `Calendar`, `Input OTP`

**Navigation:**
- `Tabs`, `Accordion`, `Breadcrumb`, `Menubar`
- `Navigation Menu`, `Pagination`

**Overlays:**
- `Dialog`, `Sheet`, `Drawer`, `Popover`, `Tooltip`
- `Alert Dialog`, `Context Menu`, `Dropdown Menu`, `Hover Card`

**Feedback:**
- `Toast` (Sonner), `Alert`, `Progress`, `Skeleton`

**Data Display:**
- `Table`, `Card`, `Avatar`, `Badge`, `Separator`
- `Chart` (Recharts), `Carousel`

**Layout:**
- `Resizable`, `Scroll Area`, `Aspect Ratio`, `Collapsible`

**Advanced:**
- `Command`, `Toggle`, `Toggle Group`, `Form` (react-hook-form)

---

## 🗂️ Schema & API Mapping

### CRUD Coverage by Table

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|-------|--------|--------|--------|--------|-------|
| `profiles` | ✅ User | ❌ System | ✅ User | ❌ | Trigger creates on signup |
| `user_roles` | ✅ User/Admin | ❌ Admin | ❌ Admin | ❌ Admin | View own, admin manages |
| `llm_configurations` | ✅ Admin | ✅ Admin | ✅ Admin | ✅ Admin | Full CRUD admin-only |
| `llm_usage_logs` | ✅ Admin | ✅ System | ✅ Admin | ✅ Admin | System writes, admin reads |
| `provider_health` | ✅ Admin | ✅ Admin | ✅ Admin | ✅ Admin | Table exists, not populated |
| `budget_settings` | ✅ Admin | ✅ Admin | ✅ Admin | ✅ Admin | Full CRUD admin-only |
| `audit_logs` | ✅ Admin | ✅ System | ❌ | ❌ | Append-only, 1-year retention |
| `rate_limit_config` | ✅ Admin | ❌ | ✅ Admin | ❌ | Pre-seeded, update-only |
| `rate_limit_attempts` | ✅ Admin | ✅ System | ✅ System | ✅ System | Auto-cleanup after 7 days |

---

### Missing Tables

1. **`agent_tasks`** - Task definitions
   ```sql
   CREATE TABLE agent_tasks (
     id UUID PRIMARY KEY,
     workflow_id UUID,
     agent_id TEXT,
     status TEXT,  -- "pending" | "running" | "completed" | "failed"
     inputs JSONB,
     outputs JSONB,
     depends_on TEXT[],
     created_at TIMESTAMP WITH TIME ZONE,
     completed_at TIMESTAMP WITH TIME ZONE
   );
   ```
   **Impact:** Tasks are in-memory only, lost on refresh

2. **`execution_logs`** - Execution history
   ```sql
   CREATE TABLE execution_logs (
     id UUID PRIMARY KEY,
     task_id UUID,
     agent_role TEXT,
     event_type TEXT,  -- "started" | "completed" | "failed"
     event_data JSONB,
     created_at TIMESTAMP WITH TIME ZONE
   );
   ```
   **Impact:** No execution audit trail

3. **`workflow_definitions`** - Workflow storage
   ```sql
   CREATE TABLE workflow_definitions (
     id UUID PRIMARY KEY,
     user_id UUID,
     name TEXT,
     description TEXT,
     manifest JSONB,
     created_at TIMESTAMP WITH TIME ZONE,
     updated_at TIMESTAMP WITH TIME ZONE
   );
   ```
   **Impact:** Workflows not reusable, must re-enter each time

4. **`evidence_bundles`** - Evidence metadata
   ```sql
   CREATE TABLE evidence_bundles (
     id UUID PRIMARY KEY,
     workflow_id UUID,
     bundle_url TEXT,
     f_total NUMERIC,
     mutation_score NUMERIC,
     coverage NUMERIC,
     created_at TIMESTAMP WITH TIME ZONE
   );
   ```
   **Impact:** Evidence bundles lost, no history

---

### Missing Storage Buckets

**Required Buckets:**
1. **`evidence-bundles`** - HTML/JSON evidence artifacts
2. **`test-artifacts`** - Coverage reports, mutation results
3. **`user-uploads`** - Workflow manifests, custom scripts

**RLS Policies Needed:**
- Users can view own artifacts
- Admins can view all artifacts
- System can upload artifacts

---

### Redundant/Unused Code

1. **`nomforge/` directory** - Vietnamese Chữ Nôm translation prototype
   - Not integrated into main application
   - Separate FastAPI service
   - 🗑️ **Candidate for removal** if not actively used

2. **Duplicate Agent Definitions:**
   - Built-in A0-A10 agents in `packages/agents/`
   - Custom agents in `src/lib/agent-registry.ts`
   - Agent profiles in `localStorage`
   - 🔧 **Needs consolidation**

3. **Mock Data in Production Code:**
   - `src/mocks/orchestration.ts` - Mock task data
   - `orchestrator-service.ts` - Sample tasks
   - 🧹 **Should be moved to test fixtures**

---

## 🚨 Gaps & Inconsistencies

### 🔴 Critical Blockers

#### 1. Agents are Simulated
**Problem:** A1-A10 agents do not perform real reasoning
- `A1_spec_architect.ts` is a placeholder
- All agents return mock data
- No connection to LLM proxy
- No real task execution

**Impact:** Cannot achieve autonomous operation

**Fix Required:**
- Implement agent-LLM integration (`src/lib/agent-llm-integration.ts`)
- Connect agents to `llm-proxy` edge function
- Add real prompt engineering for each agent role
- Implement task result validation

**Estimated Effort:** 4-6 weeks

---

#### 2. Code Execution Not Sandboxed
**Problem:** `execute-code` edge function runs in main process
- No Docker/VM isolation
- No resource limits
- No rollback capability
- Security risk for autonomous agents

**Impact:** Unsafe for production agent use

**Fix Required:**
- Implement Docker/VM sandboxing
- Add resource limits (CPU, memory, disk)
- Git-based rollback for failed changes
- Pre-flight validation
- Emergency stop mechanism

**Estimated Effort:** 3-4 weeks

---

#### 3. Evidence Bundles are Empty
**Problem:** Evidence service uses mock data
- No real test execution
- No Vitest runner integration
- No Stryker mutation testing
- No coverage collection

**Impact:** Cannot generate real evidence for compliance

**Fix Required:**
- Wire Vitest test runner to evidence service
- Integrate Stryker mutation testing
- Collect real coverage data
- Generate SBOM from real dependencies
- Store evidence in Supabase Storage

**Estimated Effort:** 3-4 weeks

---

### ⚠️ Major Gaps

#### 1. No Real Execution Logs
**Problem:** No persistent execution history
- `execution_logs` table doesn't exist
- Execution events not tracked
- No debugging trail for agent failures

**Impact:** Cannot diagnose agent issues

**Fix Required:**
- Create `execution_logs` table
- Log all agent actions (start, complete, fail)
- Add execution log viewer page
- Export logs for debugging

**Estimated Effort:** 1-2 weeks

---

#### 2. Provider Health Not Active
**Problem:** `provider_health` table exists but not populated
- No health check cron job
- No automatic provider rotation
- No latency tracking
- No alert system

**Impact:** Manual intervention needed on provider outages

**Fix Required:**
- Implement health check cron job (every 5 minutes)
- Track latency, success rate, consecutive failures
- Auto-rotate on provider degradation
- Alert system for admin users

**Estimated Effort:** 1-2 weeks

---

#### 3. Missing Agent-LLM Integration
**Problem:** `agent-llm-integration.ts` is partial implementation
- Agents don't call LLM proxy
- No prompt engineering per agent
- No streaming responses
- No error handling

**Impact:** Agents cannot perform real tasks

**Fix Required:**
- Complete agent-LLM bridge
- Add agent-specific prompts
- Implement streaming for real-time feedback
- Add retry logic and error handling

**Estimated Effort:** 2-3 weeks

---

#### 4. Contract Validation Not Enforced
**Problem:** Contracts exist but not checked in CI
- No automatic schema validation
- No breaking change detection
- No contract diff in evidence bundles

**Impact:** Schema drift can break integrations

**Fix Required:**
- Add contract validation to CI pipeline
- Generate contract diffs in PRs
- Block merges on breaking changes
- Add contract validation to agent workflows

**Estimated Effort:** 1-2 weeks

---

### 🟡 Minor Issues

#### 1. User Guide Page Empty
**Problem:** `/user-guide` route exists but no content

**Fix:** Write comprehensive user documentation

**Estimated Effort:** 1 week

---

#### 2. Demo Mode Logic Inconsistent
**Problem:** Demo mode auto-login not working consistently
- Memory states demo mode but login flow unclear
- No clear demo account creation

**Fix:** 
- Create dedicated demo account in database
- Auto-login on `/` route visit
- Clear indicator when in demo mode

**Estimated Effort:** 2-3 days

---

#### 3. Agent Profile System Incomplete
**Problem:** Agent profiles stored in localStorage only
- Not synced across devices
- Lost on cache clear
- No backup/restore

**Fix:**
- Create `agent_profiles` table
- Sync to database with RLS policies
- Add import/export functionality

**Estimated Effort:** 3-4 days

---

### 🧹 Code Quality Issues

#### 1. Repetitive Supabase Queries
**Problem:** Same query patterns duplicated across files
- Profile fetching repeated
- Role checking duplicated
- No query abstraction layer

**Fix:**
- Create `src/lib/db-queries.ts` with reusable queries
- Use React Query custom hooks
- Centralize error handling

**Example:**
```typescript
// src/lib/db-queries.ts
export const useProfile = (userId: string) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    }
  });
};
```

---

#### 2. Error Handling Gaps
**Problem:** Inconsistent error handling
- Some functions throw, others return `null`
- No global error boundary
- Silent failures in async operations

**Fix:**
- Add global `ErrorBoundary` component
- Standardize error return types
- Add toast notifications for user-facing errors
- Log all errors to audit system

---

#### 3. Unused Code (`nomforge/`)
**Problem:** Vietnamese Chữ Nôm translation prototype not integrated
- Separate FastAPI service
- No connection to main app
- 🗑️ Consider removal if not actively used

---

#### 4. Missing TypeScript Strictness
**Problem:** TypeScript not in strict mode
- `any` types used in places
- No strict null checks
- Implicit returns

**Fix:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true
  }
}
```

---

### 🔥 Fragile/Risky Code

#### 1. Demo Mode Logic
**Location:** `src/pages/Index.tsx`, `src/pages/Auth.tsx`

**Problem:** Demo account handling unclear
- Memory states demo mode but implementation inconsistent
- No dedicated demo credentials
- Auto-login flow not tested

**Risk:** Users may get stuck or see errors

---

#### 2. Hardcoded Sample Tasks
**Location:** `src/lib/orchestrator-service.ts`

**Problem:** `initializeSampleTasks()` creates mock tasks
- Mixed with production code
- No clear separation of concerns
- Mock data pollutes real execution

**Risk:** Demo data could appear in production

**Fix:** Move to `src/mocks/` and load conditionally

---

#### 3. No Rate Limiting on LLM Calls
**Problem:** No rate limiting on `llm-proxy` edge function
- Could exceed provider rate limits
- Could exhaust budget quickly
- No protection against abuse

**Risk:** Service degradation or unexpected costs

**Fix:** Add rate limiting to LLM proxy based on budget

---

## 🔌 Integration Readiness

### Can I Add a New Module (e.g., Root Character System)?

**Answer: Yes, but with caveats**

**Easy to Integrate:**
- ✅ As a new page in the dashboard
- ✅ As a custom agent (leveraging agent profile system)
- ✅ As an edge function (new Supabase function)
- ✅ Using existing LLM proxy for AI features

**Challenging to Integrate:**
- ⚠️ Real execution (due to simulated agents)
- ⚠️ File storage (no storage buckets yet)
- ⚠️ Cross-agent communication (agents are mocked)

---

### Example: Root Character System Integration Plan

**Scenario:** Add a module that generates root character analysis using LLM

**Recommended Approach:**

#### Option 1: Standalone Feature (Fastest - 3 weeks)
1. **Database Schema** (3 days)
   ```sql
   CREATE TABLE root_characters (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES auth.users,
     name TEXT,
     root_character TEXT,
     analysis JSONB,
     created_at TIMESTAMP WITH TIME ZONE
   );
   ```

2. **Edge Function** (1 week)
   - Create `supabase/functions/generate-root-character/`
   - Use `llm-proxy` to call Lovable AI
   - Prompt engineering for character analysis
   - Store results in `root_characters` table

3. **Frontend UI** (1.5 weeks)
   - Add `/root-character` route
   - Create `RootCharacter.tsx` page
   - Form for user input (name, birthdate, etc.)
   - Display analysis results
   - History viewer for past analyses

4. **Polish** (0.5 weeks)
   - Add to sidebar navigation
   - Add loading states
   - Error handling
   - Export/share functionality

**Total Effort:** 3 weeks

**Advantages:**
- Doesn't depend on simulated agents
- Uses existing LLM infrastructure
- Can ship independently
- Provides immediate value

---

#### Option 2: As a Custom Agent (Requires Phase II - 4 weeks)
1. **Agent Implementation** (2 weeks)
   - Create `A11_RootCharacterAnalyzer` agent
   - Connect to LLM proxy
   - Define system prompt
   - Implement task execution logic

2. **Workflow Integration** (1 week)
   - Add to agent registry
   - Define task dependencies
   - Add to orchestration DAG

3. **UI Integration** (1 week)
   - Add to Agent Status Grid
   - Create dedicated page
   - Workflow definition UI

**Total Effort:** 4 weeks

**Blockers:**
- ❌ Requires real agent implementation (Phase II.A)
- ❌ Depends on agent-LLM integration

**Recommendation:** Choose **Option 1** for fastest time-to-value

---

### Integration Checklist for New Modules

Before adding a new module, verify:

**Database:**
- [ ] Schema designed with RLS policies
- [ ] Foreign keys reference `auth.users`
- [ ] Indexes added for queries
- [ ] Migration tested locally

**Edge Function:**
- [ ] Uses `llm-proxy` for AI features
- [ ] API key stored in Supabase secrets
- [ ] Error handling and logging
- [ ] Rate limiting considered

**Frontend:**
- [ ] Route added to `App.tsx`
- [ ] Protected with `ProtectedRoute` if needed
- [ ] Sidebar navigation updated
- [ ] shadcn/ui components used
- [ ] Responsive design
- [ ] Loading and error states

**Testing:**
- [ ] Unit tests for business logic
- [ ] API tests for edge function
- [ ] Manual QA checklist

**Documentation:**
- [ ] User guide updated
- [ ] API documentation
- [ ] README updated

---

## 🏥 Development Health Assessment

### Code Quality Metrics

| Metric | Target | Current | Grade |
|--------|--------|---------|-------|
| **Type Safety** | 100% | ~85% | AA |
| **Component Reuse** | High | Medium | A |
| **State Management** | Centralized | Mixed | A |
| **Error Handling** | Comprehensive | Partial | B |
| **Test Coverage** | ≥95% | ⚠️ Infrastructure only | N/A |
| **Documentation** | Complete | Partial | B |
| **Performance** | < 2s load | Good | AAA |

---

### Architecture Assessment

**Strengths:**
- ✅ Clear separation of concerns (packages, components, hooks)
- ✅ Monorepo structure with Turbo/pnpm
- ✅ Supabase integration well-architected
- ✅ Design system (shadcn/ui) consistently used
- ✅ TypeScript across codebase
- ✅ React Query for async state

**Weaknesses:**
- ⚠️ Service singletons with mutable state (`orchestrator-service.ts`)
- ⚠️ Mock data mixed with production code
- ⚠️ No clear boundary between demo and production code
- ⚠️ localStorage used for critical state (agent profiles)
- 🔴 No test execution pipeline (biggest gap)

---

### Anti-Patterns Found

#### 1. Service Singletons with Mutation
**Location:** `src/lib/orchestrator-service.ts`

**Problem:**
```typescript
class OrchestratorService {
  private static instance: OrchestratorService;
  private orchestrator: Orchestrator;  // ⚠️ Mutable shared state
  
  initializeSampleTasks() {
    // ⚠️ Mutates singleton state
    this.orchestrator.registerTask(...)
  }
}
```

**Risk:** State shared across components, hard to test

**Fix:** Use React Context or Zustand for state management

---

#### 2. localStorage for Critical State
**Location:** `src/lib/agent-registry.ts`

**Problem:** Custom agents stored in `localStorage`
- Not synced across devices
- Lost on cache clear
- No backup/restore

**Risk:** Data loss

**Fix:** Move to Supabase database with RLS policies

---

#### 3. Async Operations Without Loading States
**Location:** Multiple components

**Problem:**
```typescript
const handleSubmit = async () => {
  const result = await executeWorkflow(data);  // ⚠️ No loading state
  // ...
};
```

**Risk:** Poor UX, no feedback during long operations

**Fix:** Add loading states with `useState` or React Query

---

#### 4. No Request Cancellation
**Problem:** Async requests not cancelled on component unmount
- Memory leaks possible
- "Can't perform state update on unmounted component" warnings

**Fix:** Use React Query or AbortController

---

### Security Assessment

**Strengths:**
- ✅ Row-Level Security (RLS) on all tables
- ✅ JWT authentication with auto-refresh
- ✅ API keys stored in Supabase Vault
- ✅ Rate limiting on auth endpoints
- ✅ Audit logging for sensitive actions
- ✅ MFA for admin users

**Weaknesses:**
- 🔴 Code execution not sandboxed (critical)
- ⚠️ No CSRF protection on forms
- ⚠️ No input sanitization on workflow manifests
- ⚠️ No SQL injection protection (relies on Supabase)

**Recommendations:**
1. Add sandboxing to `execute-code` (Docker/VM)
2. Validate all user inputs with Zod schemas
3. Add CSRF tokens to forms
4. Sanitize workflow manifest inputs

---

## 🚀 Recommended Next Steps

### Phase 1: Make Agents Real (4-6 weeks) - HIGHEST PRIORITY

This is the **critical path** to production. Without real agents, the system cannot achieve autonomous operation.

#### Week 1-2: Connect Agent Profiles to LLM Proxy
**Goal:** Bridge agent system to LLM infrastructure

**Tasks:**
1. Complete `src/lib/agent-llm-integration.ts`
   ```typescript
   export async function executeAgentTask(
     agentRole: string,
     task: AgentTask
   ): Promise<TaskResult> {
     // 1. Load agent profile
     const profile = getAgentProfile(agentRole);
     
     // 2. Build prompt from profile.systemPrompt + task.inputs
     const prompt = buildPrompt(profile, task);
     
     // 3. Call llm-proxy edge function
     const response = await callLLMProxy({
       provider: profile.preferredProvider || "lovable-ai",
       model: profile.preferredModel || "gpt-4",
       messages: [
         { role: "system", content: profile.systemPrompt },
         { role: "user", content: prompt }
       ]
     });
     
     // 4. Parse response and return structured result
     return parseAgentResponse(response);
   }
   ```

2. Update `A0_orchestrator.ts` to use real LLM calls
3. Add streaming support for real-time feedback
4. Add retry logic and error handling

**Deliverable:** Agents can call LLM proxy and get real responses

---

#### Week 3-4: Implement Safe Code Execution
**Goal:** Sandboxed execution environment

**Tasks:**
1. Refactor `supabase/functions/execute-code/`
   - Add Docker containerization
   - Resource limits (CPU, memory, disk, timeout)
   - Network isolation
   - Read-only filesystem except `/tmp`

2. Add rollback capability
   - Git-based snapshots before execution
   - Auto-revert on failure
   - Manual rollback UI

3. Pre-flight validation
   - AST parsing for dangerous patterns
   - Whitelist allowed modules
   - Block `eval()`, `exec()`, etc.

**Deliverable:** Safe code execution sandbox

---

#### Week 5-6: Build Real Task Runner
**Goal:** Execute workflows with real agents

**Tasks:**
1. Create `execution_logs` table
2. Log all agent actions (start, complete, fail)
3. Wire Vitest runner to collect real test results
4. Generate evidence bundles from real data
5. Add execution log viewer page

**Deliverable:** End-to-end workflow execution with evidence

---

### Phase 2: Quality Automation (3-4 weeks)

#### Week 7-8: Generate Real Evidence Bundles
**Goal:** Replace mock evidence with real test results

**Tasks:**
1. Integrate Vitest runner into evidence service
2. Wire Stryker mutation testing to CI
3. Collect real coverage data
4. Generate SBOM from `pnpm list`
5. Store evidence bundles in Supabase Storage

**Deliverable:** Real evidence bundles with test artifacts

---

#### Week 9-10: Implement Contract Validation
**Goal:** Enforce schema compliance in CI

**Tasks:**
1. Add contract validation to CI pipeline
2. Generate contract diffs in PRs
3. Block merges on breaking changes
4. Add contract validation to agent workflows

**Deliverable:** Automated contract enforcement

---

#### Week 11: Add Provider Health Monitoring
**Goal:** Automatic provider failover

**Tasks:**
1. Implement health check cron job (every 5 minutes)
2. Track latency, success rate, consecutive failures
3. Auto-rotate providers on degradation
4. Alert system for admin users

**Deliverable:** Resilient LLM infrastructure

---

### Phase 3: Self-Verifying DAGs (2-3 weeks)

#### Week 12-13: Implement A5 Adjudicator
**Goal:** Dual-path execution with validation

**Tasks:**
1. Implement A4 Generator (Path A) and A4 Generator (Path B)
2. Build A5 Adjudicator logic
   - Compare outputs
   - Vote on best result
   - Resolve conflicts
3. Add RFC protocol for agent disagreements

**Deliverable:** Self-verifying code generation

---

#### Week 14: Add Real-Time Metrics
**Goal:** Live dashboard updates

**Tasks:**
1. Supabase Realtime for live task updates
2. Streaming metrics to dashboard
3. WebSocket connection for agent status
4. Telemetry page with live charts

**Deliverable:** Real-time orchestration monitoring

---

### Phase 4: Production Hardening (2-3 weeks)

#### Week 15: Fix Demo Mode
**Goal:** Consistent demo experience

**Tasks:**
1. Create dedicated demo account in database
2. Auto-login on `/` route visit
3. Clear demo mode indicator
4. Separate demo data from production

**Deliverable:** Working demo mode

---

#### Week 16: Add File Storage
**Goal:** Evidence persistence

**Tasks:**
1. Create Supabase Storage buckets
   - `evidence-bundles`
   - `test-artifacts`
   - `user-uploads`
2. Add RLS policies for user-scoped access
3. Implement upload/download API
4. Add retention policies (e.g., 90 days)

**Deliverable:** Persistent evidence storage

---

#### Week 17: Improve Error UX
**Goal:** User-friendly error handling

**Tasks:**
1. Add global `ErrorBoundary`
2. Standardize error toast notifications
3. Add detailed error pages with suggestions
4. Log all errors to audit system

**Deliverable:** Production-grade error handling

---

#### Week 18: Cleanup Unused Code
**Goal:** Reduce technical debt

**Tasks:**
1. Remove `nomforge/` if not actively used
2. Consolidate duplicate agent definitions
3. Move mock data to `src/mocks/`
4. Enable TypeScript strict mode
5. Fix all linter warnings

**Deliverable:** Clean, maintainable codebase

---

### Leanest MVP Path: Root Character Module (3 weeks)

**If you want to ship value NOW** without waiting for Phase II:

#### Week 1: Database + API
1. Create `root_characters` table with RLS policies
2. Implement `generate-root-character` edge function
3. Connect to `llm-proxy` for LLM-powered analysis
4. Add prompt engineering for character insights

#### Week 2: UI
1. Create `/root-character` page
2. Build input form (name, birthdate, preferences)
3. Display analysis results with charts
4. Add history viewer for past analyses

#### Week 3: Polish
1. Add to sidebar navigation
2. Export/share functionality
3. Loading states and error handling
4. User guide section
5. Demo video/screenshots

**Deliverable:** Standalone AI-powered feature using existing infrastructure

---

## 📚 Quick Start Guide

### Prerequisites
- **Node.js**: 20.x or 22.x
- **pnpm**: Latest version
- **Git**: For version control

### Installation

```bash
# Clone repository
git clone https://github.com/hwinnwin/Lumen-Orca.git
cd Lumen-Orca

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:5173`

---

### Development Commands

```bash
# Development (all packages in parallel)
pnpm dev

# Build all packages
pnpm -r build

# Lint + typecheck
pnpm -r lint
pnpm -r typecheck

# Test suite
pnpm -r test:unit          # Unit tests
pnpm -r test:property      # Property-based tests (fast-check)
pnpm -r test:mutation      # Mutation testing (Stryker)

# Quality assurance
pnpm -r qa:perf            # Performance benchmarks
pnpm -r qa:security        # Security scanning

# Generate evidence bundle
pnpm -r evidence:bundle
```

Evidence bundle: `packages/evidence/dist/index.html`

---

### Environment Variables

**Required (auto-managed by Lovable Cloud):**
```env
VITE_SUPABASE_URL=https://znkkpibjlifhqvtnghsd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=znkkpibjlifhqvtnghsd
```

**Optional (for LLM providers):**
```env
LOVABLE_API_KEY=<auto-provided>
OPENAI_API_KEY=<stored-in-supabase-vault>
ANTHROPIC_API_KEY=<not-set>
GOOGLE_AI_API_KEY=<not-set>
```

**DO NOT** edit `.env` manually - it's auto-generated by Supabase.

---

### First-Time Setup

1. **Sign Up**: Visit `http://localhost:5173/auth`
2. **Default Role**: Assigned `viewer` role automatically
3. **Promote to Admin**: 
   ```sql
   -- Run in Supabase SQL editor
   UPDATE user_roles
   SET role = 'admin'
   WHERE user_id = '<your-user-id>';
   ```
4. **Configure LLM Providers**: Visit `/settings` → Providers tab
5. **Enroll MFA** (admin users): Visit `/mfa-setup`

---

## 🛠️ Technical Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** React Query (@tanstack/react-query)
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts

### Backend (Lovable Cloud / Supabase)
- **Database:** PostgreSQL 15 with Row-Level Security
- **Auth:** Supabase Auth (email/password + Google OAuth + MFA)
- **Edge Functions:** Deno runtime
  - `llm-proxy`: Multi-provider LLM routing
  - `execute-code`: Code execution (not sandboxed)
  - `track-activity`: Usage logging
  - `check-rate-limit`: Rate limiting enforcement
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

## 🔐 Security Architecture

### Authentication Flow

```
User → Frontend (React)
  ↓
Supabase Auth (JWT)
  ↓
RLS Policies (PostgreSQL)
  ↓
Protected Resources
```

### Row-Level Security (RLS) Policies

**profiles:**
- Users can view/update own profile only

**user_roles:**
- Users can view own roles
- Admins can manage all roles (via `has_role()`)

**llm_configurations:**
- Admins can view/insert/update/delete

**llm_usage_logs:**
- Admins can view/insert/update/delete

**provider_health:**
- Admins can view/insert/update/delete

**budget_settings:**
- Admins can view/insert/update/delete

**audit_logs:**
- Service role can insert (via edge functions)
- Admins can view
- **No UPDATE/DELETE** (append-only for compliance)

**rate_limit_config:**
- Admins can view/update
- **No INSERT/DELETE** (pre-seeded)

**rate_limit_attempts:**
- Admins can manage all

---

### API Security

**Edge Functions:**
- JWT validation via `Authorization: Bearer <token>`
- Service role key for system operations
- Secrets stored in Supabase Vault

**LLM Proxy:**
- API keys stored as Supabase secrets
- Budget enforcement (hard stop at 100%)
- Rate limiting per provider

**Rate Limiting:**
- IP-based rate limiting on auth endpoints
- Automatic IP blocking on threshold breach
- Configurable thresholds per endpoint

---

### Security Best Practices

**Implemented:**
- ✅ RLS on all tables
- ✅ JWT authentication
- ✅ API key encryption
- ✅ Audit logging
- ✅ MFA for admin users
- ✅ Rate limiting

**Missing:**
- 🔴 Code execution sandboxing (CRITICAL)
- ⚠️ CSRF protection
- ⚠️ Input sanitization
- ⚠️ Content Security Policy headers

---

## 📞 Support & Escalation

### Repository
- **GitHub:** https://github.com/hwinnwin/Lumen-Orca
- **Issues:** https://github.com/hwinnwin/Lumen-Orca/issues
- **Discussions:** https://github.com/hwinnwin/Lumen-Orca/discussions

### Production Deployment
- **Lovable URL:** https://lovable.dev/projects/fa2a1b8a-9faa-4f5f-9a09-960a15bc6bf6
- **Production Domain:** https://lumenorca.app/

### Incident Escalation

| Priority | Definition | Response Time | Notification |
|----------|-----------|---------------|--------------|
| **P0 (Critical)** | System down, data loss risk | Immediate | Page on-call |
| **P1 (High)** | Major feature broken | 1 hour | Email + Slack |
| **P2 (Medium)** | Minor feature broken | 4 hours | Email |
| **P3 (Low)** | Cosmetic issue | 1 day | Ticket only |

---

## 📄 Key Documentation Files

### Essential Reading (Priority Order)
1. **[OPERATIONAL_STATUS.md](docs/OPERATIONAL_STATUS.md)** - Current system capabilities
2. **[PHASE_II_SETUP.md](docs/PHASE_II_SETUP.md)** - Agent implementation roadmap
3. **[lumen_master_blueprint.md](docs/blueprints/lumen_master_blueprint.md)** - System architecture
4. **[GRADING_SYSTEM.md](docs/GRADING_SYSTEM.md)** - AAA/AA/A grading thresholds
5. **[LLM_PROVIDER_SYSTEM.md](docs/LLM_PROVIDER_SYSTEM.md)** - Multi-provider routing

### Additional Resources
- **[PHASE_II_TRANSITION.md](docs/PHASE_II_TRANSITION.md)** - Manual transition checklist
- **[FINALIZATION.md](docs/FINALIZATION.md)** - Phase I verification
- **[GO_NO_GO_CHECKLIST.md](docs/GO_NO_GO_CHECKLIST.md)** - Pre-deployment validation
- **[BRANCH_PROTECTION_SETUP.md](docs/BRANCH_PROTECTION_SETUP.md)** - CI/CD enforcement
- **[USER_AUTH_AND_PROFILES.md](docs/USER_AUTH_AND_PROFILES.md)** - Authentication guide

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

## 🔧 How to Deploy

### Frontend Deployment

**Option 1: Lovable Platform (Recommended)**
```
1. Visit https://lovable.dev/projects/fa2a1b8a-9faa-4f5f-9a09-960a15bc6bf6
2. Click "Share" → "Publish"
3. Frontend deploys automatically to https://lumenorca.app/
```

**Option 2: Self-Hosting**
```bash
# Build production bundle
pnpm -r build

# Deploy dist/ to your hosting provider
# (Vercel, Netlify, Cloudflare Pages, etc.)
```

### Backend Deployment

**Edge Functions:** Auto-deployed on push to `main` branch

**Database Migrations:** Auto-applied via Lovable Cloud

**Secrets:** Managed in Lovable Cloud → Settings → Secrets

---

## 🎓 Learning Resources

### For New Developers

1. **Start here:** [Master Blueprint](docs/blueprints/lumen_master_blueprint.md)
2. **Understand the vision:** [OPERATIONAL_STATUS.md](docs/OPERATIONAL_STATUS.md)
3. **See the roadmap:** [PHASE_II_SETUP.md](docs/PHASE_II_SETUP.md)
4. **Learn the stack:** 
   - [React Docs](https://react.dev)
   - [Supabase Docs](https://supabase.com/docs)
   - [shadcn/ui](https://ui.shadcn.com/)
   - [Vitest](https://vitest.dev/)

### For Contributors

1. Read: [CONTRIBUTING.md](CONTRIBUTING.md)
2. Review: [Go/No-Go Checklist](docs/GO_NO_GO_CHECKLIST.md)
3. Follow: [Branch Protection Setup](docs/BRANCH_PROTECTION_SETUP.md)
4. Use: Agent Log format in commit messages

---

## 🏅 Project Governance

### Contribution Workflow

```
1. Create issue (use labels: epic/story/task)
2. Create feature branch
3. Implement changes with Agent Log commits
4. Run quality checks (lint, typecheck, tests)
5. Open PR with evidence bundle
6. Pass CI gates (contract validation, six-nines)
7. Get 1 review approval
8. Merge to main
```

### Quality Gates (Required for Merge)

- ✅ All CI checks pass
- ✅ Contract validation succeeds
- ✅ Evidence bundle attached
- ✅ F_total ≤ 1e-6 (when real tests enabled)
- ✅ 1 review approval
- ✅ No breaking changes without RFC

---

## 📝 Issue Management

### Auto-Create GitHub Issues

```bash
export GITHUB_TOKEN="ghp_xxx"  # repo scope
export OWNER="hwinnwin"
export REPO="Lumen-Orca"
bash scripts/bootstrap_lumen_issues.sh
```

Creates:
- Labels (epic, story, task, blocker, etc.)
- Epic: Dashboard v1
- Stories: Spec, Contracts, QA, UI, Integrator
- Tasks: Linked to stories with cross-references

See [scripts/README.md](scripts/README.md) for details.

---

## 🚧 Current Limitations

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

---

## 🎉 Summary

**Lumen Orca is a well-architected autonomous orchestration system with:**
- ✅ Production-ready governance infrastructure
- ✅ Robust LLM provider system
- ✅ Comprehensive authentication and security
- ✅ Beautiful frontend dashboard

**But requires 3-4 months of focused work to achieve production autonomy:**
- 🔴 Real agent implementation (biggest gap)
- 🔴 Safe code execution sandbox
- 🔴 Real test execution pipeline
- 🔴 Evidence persistence

**Leanest path to shipping value NOW:**
- Build standalone AI-powered features (like Root Character System)
- Leverage existing LLM proxy infrastructure
- Ship incrementally while working toward full autonomy

---

**Last Updated:** 2025-01-30  
**Project Status:** Phase I Complete, Phase II Ready to Start  
**Next Priority:** Connect Agents to LLM Proxy (Phase II.A, Week 1-2)
