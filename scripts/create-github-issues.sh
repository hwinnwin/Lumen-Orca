#!/usr/bin/env bash
# ───────────────────────────────────────────────────────────────
# Lumen GitHub Issues Bootstrap
# Creates initial issues for coding session kickoff
# ───────────────────────────────────────────────────────────────
set -euo pipefail

OWNER="${GITHUB_OWNER:-}"
REPO="${GITHUB_REPO:-lumen-orchestration}"
TOKEN="${GH_PAT:-}"

if [[ -z "$OWNER" || -z "$TOKEN" ]]; then
  echo "❌ Error: Set GITHUB_OWNER and GH_PAT environment variables"
  echo "   Example: export GITHUB_OWNER=your-handle GH_PAT=ghp_xxx"
  exit 1
fi

echo "🚀 Creating GitHub issues for $OWNER/$REPO..."

# Issue 1: Coding Session Kickoff
gh issue create \
  --repo "$OWNER/$REPO" \
  --title "Coding Session Kickoff — GitHub + CI Setup" \
  --label "setup,ci,documentation" \
  --body "## Objective
Connect Lumen repo to GitHub, verify CI pipeline, and validate evidence bundle generation.

## Tasks
- [x] Push main branch to GitHub
- [ ] Verify CI workflow runs successfully
- [ ] Confirm evidence bundle artifact is generated
- [ ] Branch protection rules active (main)
- [ ] CODEOWNERS enforced

## Success Criteria
- CI badge shows green
- Evidence bundle downloadable from CI artifacts
- Six-nines gate (verify-six-nines) passes
- F_total ≤ 1e-6

## Agent
**A0** (Orchestrator)

## Links
- [CI Workflow](.github/workflows/ci.yml)
- [Branch Protection Docs](docs/BRANCH_PROTECTION_SETUP.md)
"

# Issue 2: A1 LLM Proxy Pilot
gh issue create \
  --repo "$OWNER/$REPO" \
  --title "Implement A1 Spec Architect via llm-proxy" \
  --label "enhancement,agent,a1,llm" \
  --body "## Objective
Wire A1 (Spec Architect) to the llm-proxy edge function using Lovable AI default provider.

## Tasks
- [ ] Create A1 agent entry point (packages/agents/src/A1_spec_architect.ts)
- [ ] Call llm-proxy with agentRole='A1' and spec generation prompt
- [ ] Log usage to llm_usage_logs table
- [ ] Add unit tests for A1 spec output validation
- [ ] Integration test: A1 → llm-proxy → response

## Acceptance
- A1 generates valid spec JSON conforming to @lumen/contracts schema
- Usage logged with provider='lovable-ai', model='gemini-2.5-flash'
- Tests pass: pnpm test:unit -F @lumen/agents
- Evidence bundle includes A1 test coverage ≥95%

## Agent
**A1** (Spec Architect)

## References
- [LLM Proxy Docs](docs/LLM_PROVIDER_SYSTEM.md)
- [A1 Workflow](.github/workflows/agents/A1_spec_architect.yml)
"

# Issue 3: User Auth & Profiles (Epic)
gh issue create \
  --repo "$OWNER/$REPO" \
  --title "Epic: User Auth + RBAC Implementation" \
  --label "epic,auth,phase-ii" \
  --body "## Epic Manifest
Implement Google OAuth, user profiles, and role-based access control (RBAC).

## Work Packages
- [x] Google OAuth sign-in via Supabase Auth
- [x] Profiles table + auto-provisioning trigger
- [x] RBAC roles: admin, developer, viewer
- [x] Auth UI (login, logout, avatar menu)
- [x] Profile page (edit name, avatar)
- [x] Protected admin endpoints (/api/me, /api/metrics/admin)
- [x] Last-seen tracking + usage linkage
- [ ] Documentation (USER_AUTH_AND_PROFILES.md)

## Success Metrics
- Sign-in latency ≤2s
- Profile auto-create rate: 100%
- RBAC accuracy: 100%
- Session persistence ≥24h

## Agent
**A0, A4, A6, A9**

## References
- [Epic YAML](docs/epics/lumen_user_auth_profiles.yaml)
- [User Guide](docs/USER_AUTH_AND_PROFILES.md)
"

echo ""
echo "✅ Issues created successfully!"
echo "   View at: https://github.com/$OWNER/$REPO/issues"
