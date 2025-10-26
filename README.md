# Lumen — Precision Orchestration Instrument

[![CI - Six-Nines Gate](https://github.com/hwinnwin/lumen-sentinel-nexus/actions/workflows/ci.yml/badge.svg)](https://github.com/hwinnwin/lumen-sentinel-nexus/actions/workflows/ci.yml)
[![Determinism](https://img.shields.io/badge/determinism-%3E99.99%25-success)]()
[![Mutation Score](https://img.shields.io/badge/mutation-%E2%89%A50.80-success)]()
[![Coverage](https://img.shields.io/badge/coverage-%E2%89%A595%25-success)]()
[![F_total](https://img.shields.io/badge/F__total-%E2%89%A410%E2%81%BB%E2%81%B6-critical)]()

> **Six-Nines Governance**: RCs accepted only if **F_total ≤ 10⁻⁶** across gated checks; mutation ≥ 0.80 (critical), coverage ≥ 95% (critical), determinism > 99.99%, flake < 0.1%.

Multi-agent orchestration platform with evidence-based quality gates, contract-driven architecture, and precision reliability metrics.

🚀 [**Run Issue Bootstrap**](../../actions/workflows/bootstrap-issues.yml) — One-click label + issue creation  
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
