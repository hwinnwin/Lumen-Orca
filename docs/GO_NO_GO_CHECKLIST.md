# Go/No-Go Checklist — Lumen System Activation

This checklist ensures the Lumen precision orchestration system is fully operational and enforceable end-to-end.

## 🚦 Pre-Launch Checklist

### 1. Root package.json (Manual Action Required)

- [ ] Add `"workspaces": ["packages/*"]` to root `package.json`
- [ ] Add Turbo scripts: `build`, `dev`, `test:*`, `qa:*`, `evidence:bundle`
- [ ] Verify fallback works: `pnpm dlx turbo run build`

**Reference**: See `TODO_PACKAGE_JSON.md` for exact configuration.

**Status**: ⚠️ Manual action required (Lovable cannot modify root package.json)

---

### 2. Contracts-First Sanity

- [ ] `packages/agents` imports `@lumen/contracts`
- [ ] `src/` (UI) imports `@lumen/contracts`
- [ ] Compatibility tests exist in `packages/contracts/tests/`
- [ ] Golden fixtures present in `packages/contracts/`
- [ ] CI blocks merges if contract checks fail

**Validation**:
```bash
grep -r "@lumen/contracts" packages/agents/src/
grep -r "@lumen/contracts" src/
pnpm -C packages/contracts test
```

**Status**: ✅ Wired (verify with grep above)

---

### 3. Six-Nines Gate Visible

- [ ] `packages/qa/src/sixNines.ts` implements **F_total = 1 − Π(1 − Fᵢ)**
- [ ] `MetricsPanel.tsx` displays F_total with pass/fail indicator
- [ ] F_total threshold is **≤ 10⁻⁶** (six-nines)
- [ ] UI shows: determinism, mutation, coverage, flake rate

**Validation**:
```bash
# Visit dashboard and check Metrics Panel
# F_total should be calculated and displayed
```

**Status**: ✅ Implemented

---

### 4. Evidence Bundle Completeness

The evidence bundle (`packages/evidence/dist/index.html`) must include:

- [ ] Unit/integration/E2E test results + coverage HTML
- [ ] Mutation testing report (Stryker)
- [ ] Property testing + fuzz logs (fast-check)
- [ ] Performance trends vs budgets
- [ ] Static analysis + security scans
- [ ] **Contract diff + compatibility verdict**
- [ ] **Six-nines calculation (F_total)**
- [ ] SBOM (Software Bill of Materials)
- [ ] License report

**Validation**:
```bash
pnpm -r evidence:bundle
open packages/evidence/dist/index.html
# Verify all sections render
```

**Status**: ✅ Template ready (populate with real test data)

---

### 5. Labels + Issues

- [ ] Run bootstrap script to create labels
- [ ] Epic created: "Lumen Dashboard v1"
- [ ] Stories created: A1 Spec, A3 Contracts, A5 Test, A4 Generator, A8 Integrator
- [ ] Tasks created with cross-references

**Validation**:
```bash
export GITHUB_TOKEN="ghp_xxx"
export OWNER="org-or-user"
export REPO="lumen-sentinel-nexus"
bash scripts/bootstrap_lumen_issues.sh
```

**Status**: ⚠️ Script ready, needs execution

---

### 6. Branch Protection

- [ ] Protected branch: `main`
- [ ] Required status checks: `setup`, `matrix (ubuntu-latest, 20)`
- [ ] Required reviews: 1 approval
- [ ] Conversation resolution required
- [ ] Evidence artifact must exist before merge

**Validation**: See `docs/BRANCH_PROTECTION_SETUP.md`

**Status**: ⚠️ Manual GitHub setup required

---

### 7. README Badges Live

- [ ] CI badge shows latest status
- [ ] Evidence bundle link opens `packages/evidence/dist/index.html`
- [ ] Governance line shows targets:
  - Mutation ≥ 0.80 (critical)
  - Coverage ≥ 95% (critical)
  - Determinism > 99.99%
  - Flake < 0.1%
  - **F_total ≤ 10⁻⁶**

**Status**: ✅ Badges added to README.md

---

## 🧪 Smoke Test

Run this sequence to validate the full pipeline:

```bash
# 1. Install dependencies
pnpm install

# 2. Build all packages
pnpm -r build

# 3. Lint & type check
pnpm -r lint && pnpm -r typecheck

# 4. Run test suite
pnpm -r test:unit
pnpm -r test:property
pnpm -r test:mutation

# 5. Quality assurance
pnpm -r qa:perf
pnpm -r qa:security

# 6. Generate evidence bundle
pnpm -r evidence:bundle

# 7. Verify evidence bundle
open packages/evidence/dist/index.html
```

**Expected**: All steps green, evidence bundle renders with contract diff and F_total section.

---

## 📝 First 3 Commits to Land

### Commit 1: Root Configuration
```
chore(root): add workspaces + turbo scripts

- Add pnpm workspaces array
- Add turbo run scripts for all tasks
- Update CI fallback documentation

Ref: TODO_PACKAGE_JSON.md
```

### Commit 2: Documentation
```
docs(blueprint): link badges + Agent Log in PR template

- Add PR template with Agent Log format
- Link master blueprint in README
- Document branch protection setup

Ref: docs/BRANCH_PROTECTION_SETUP.md
```

### Commit 3: Metrics Wiring
```
feat(metrics): wire F_total util into MetricsPanel with pass/fail state

- Import sixNines.ts into MetricsPanel
- Display F_total with threshold indicator
- Show supporting metrics (determinism, mutation, coverage, flake)

Evidence: packages/evidence/dist/index.html
```

---

## 🚀 Go/No-Go Decision Criteria

| Criterion | Status | Blocker? |
|-----------|--------|----------|
| Root package.json | ⚠️ Manual | YES |
| Contracts imported | ✅ Done | NO |
| Six-nines visible | ✅ Done | NO |
| Evidence complete | ✅ Template | NO |
| Labels created | ⚠️ Ready | NO |
| Branch protection | ⚠️ Manual | YES |
| README badges | ✅ Done | NO |

**GO Criteria**: All blockers resolved + smoke test passes

---

## 📋 PR Body Template

Use this for the finalization PR:

```markdown
### Agent Log
**Agent ID**: A8 (Integrator)  
**Contributor**: @your-handle  
**Scope**: Finalize repo wiring + CI + evidence + badges

**Logic Summary**:
- Contracts-first import checks; six-nines gate on MetricsPanel
- Evidence bundle includes contract diff + compat verdict + SBOM
- README badges live with governance targets
- PR template enforces Agent Log format

**Evidence**: packages/evidence/dist/index.html  
**Reviewer**: A3 (Contract Guardian)
```

---

## 🔗 References

- [Master Blueprint](../blueprints/lumen_master_blueprint.md)
- [Branch Protection Setup](BRANCH_PROTECTION_SETUP.md)
- [Bootstrap Script README](../scripts/README.md)
- [TODO: Package.json](../TODO_PACKAGE_JSON.md)
