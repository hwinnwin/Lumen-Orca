# Contributing to Lumen

Lumen uses **Agent Log** methodology and **six-nines governance** to ensure precision reliability.

## Quick Start

1. Fork and clone the repository
2. Install dependencies: `pnpm install`
3. Run the development server: `pnpm dev`
4. Make your changes following the contribution guidelines below

## Development Workflow

### 1. Contracts-First Rule

All packages exchanging data **must** import `@lumen/contracts`:

```typescript
import type { EvidenceBundle, QualityGate } from '@lumen/contracts';
```

CI will fail if contracts imports are missing. Verify locally:

```bash
bash packages/ci/scripts/check-contracts-imports.sh
```

### 2. Quality Gates

Before submitting a PR, ensure:

- **Mutation ≥ 0.80** (critical paths)
- **Coverage ≥ 95%** (critical modules)
- **Determinism > 99.99%** (reproducibility)
- **Flake rate < 0.1%** (test reliability)
- **F_total ≤ 1e-6** (six-nines compliance)

Run the full validation:

```bash
bash scripts/smoke.sh
```

### 3. Evidence Bundle

Every PR must include an evidence bundle (`packages/evidence/dist/index.html`) containing:

- Unit/property/mutation test results
- Coverage reports
- Performance metrics
- Security scan results
- Contract diff + compatibility verdict
- SBOM (Software Bill of Materials)
- **F_total calculation**

The CI automatically generates and verifies this bundle.

### 4. Pull Request Template

Use the **Agent Log** format for all PRs:

```md
### Agent Log
Agent ID: A8
Contributor: @yourhandle
Scope: [Brief description of changes]

### Logic Summary
- [Key change 1]
- [Key change 2]
- [Key change 3]

### Evidence
Location: packages/evidence/dist/index.html
F_total: [value from evidence bundle]

### Reviewer
A3 (Contract Guardian) or relevant agent/team

### Quality Gates
- [ ] Contracts import `@lumen/contracts` and compat tests pass
- [ ] Mutation ≥ 0.80, Coverage ≥ 95%, Determinism > 99.99%, Flake < 0.1%
- [ ] **F_total ≤ 1e-6** (see Evidence Bundle)
- [ ] Evidence bundle generated and attached (CI artifact)

### Changes
- [Detailed change 1]
- [Detailed change 2]

### Related Issues
Closes #[issue-number]
```

## Example PR

**Title:** `feat(metrics): tune flake model and update evidence`

### Agent Log
- **Agent ID:** A8
- **Contributor:** @devname
- **Scope:** Improve flake model + evidence render

### Logic Summary
- Updated statistical weighting for F_total calculation
- Added flake histogram to evidence bundle
- Verified bundle includes new visualization

### Evidence
- Location: `packages/evidence/dist/index.html`
- F_total: 7.3e-7 (pass ✓)

### Reviewer
A3 (Contract Guardian)

### Quality Gates
- [x] Contracts import `@lumen/contracts` and compat tests pass
- [x] Mutation 0.82, Coverage 96.1%, Determinism 99.994%, Flake 0.07%
- [x] **F_total ≤ 1e-6** (7.3e-7)
- [x] Evidence bundle generated and attached

## Branch Protection

The `main` branch is protected and requires:

1. All CI checks passing (ubuntu/macos/windows matrix)
2. Evidence bundle artifact present
3. F_total ≤ 1e-6 verified
4. 1+ approval from CODEOWNERS
5. All conversations resolved

See [Branch Protection Setup](docs/BRANCH_PROTECTION_SETUP.md) for details.

## Issue Management

We use GitHub issues with labels and Agent assignments:

- **Type labels:** `epic`, `story`, `task`, `rfc`, `blocker`
- **Area labels:** `orchestrator`, `contracts`, `ui`, `evidence`, `qa`
- **Agent labels:** `A0` through `A10`
- **Risk labels:** `high`, `medium`, `low`
- **Gate labels:** `six-nines`, `coverage`, `mutation`, `determinism`

To bootstrap the issue structure:

```bash
# Via GitHub Actions (recommended)
Actions → "Bootstrap Issues & Labels" → Run workflow

# Via CLI
export GITHUB_TOKEN="ghp_xxx"
export OWNER="org-or-user"
export REPO="lumen-sentinel-nexus"
bash scripts/bootstrap_lumen_issues.sh
```

## Sign-Off Procedure

When your PR passes all checks:

1. ✅ CI green (all OS/Node combinations)
2. ✅ `verify-evidence` job passed
3. ✅ `verify-six-nines` job passed (F_total ≤ 1e-6)
4. ✅ Code-owner review approved
5. ✅ All conversations resolved

The PR can then be merged. For releases:

```bash
pnpm run version:beta
git push origin --tags
```

## Code of Conduct

- **Precision meets compassion** — We aim for six-nines reliability while maintaining collaborative, respectful communication
- **Contracts-first** — Always validate against `@lumen/contracts`
- **Evidence-based** — Every claim must be verifiable in the evidence bundle
- **Reproducible** — All workflows must be deterministic and documented

## Resources

- [Master Blueprint](docs/blueprints/lumen_master_blueprint.md) — Architecture and agent roles
- [Go/No-Go Checklist](docs/GO_NO_GO_CHECKLIST.md) — Pre-launch verification
- [Branch Protection Setup](docs/BRANCH_PROTECTION_SETUP.md) — Enforcement configuration
- [Evidence Bundle Spec](packages/evidence/src/bundle.ts) — Bundle generation details

## Questions?

Open an issue with the `rfc` label for design discussions or the `question` label for general inquiries.

---

**Six-Nines Governance:** RCs accepted only if F_total ≤ 10⁻⁶ across gated checks.
