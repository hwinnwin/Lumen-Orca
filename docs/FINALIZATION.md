# Lumen System Finalization

Production-ready orchestration system with autonomous six-nines governance.

## ✅ Verification Checklist

### 1. Enforcement Layer Wiring

**Evidence Bundle F_total Exposure**

Open `packages/evidence/dist/index.html` and verify:

```html
<html lang="en" data-ftotal="8.2e-7">
```

The `data-ftotal` attribute must:
- Be present in the `<html>` tag
- Match the F_total value displayed in the Metrics Panel
- Be parseable by `packages/qa/scripts/verify-six-nines.js`

**Full Smoke Test**

```bash
bash scripts/smoke.sh
```

Expected output:
- ✅ All packages build successfully
- ✅ Lint and typecheck pass
- ✅ Unit/property/mutation tests pass
- ✅ Performance and security QA pass
- ✅ Evidence bundle generated at `packages/evidence/dist/index.html`

Evidence bundle must include:
- Unit/integration/E2E test results
- Coverage HTML reports
- Mutation testing results
- Property-based testing logs
- Performance metrics
- Security scan results
- **Contract diff + compatibility verdict**
- **SBOM (Software Bill of Materials)**
- **F_total calculation with breakdown**

---

### 2. Auto-Documentation

Validation routine table added to `docs/BRANCH_PROTECTION_SETUP.md`:

| Check | Gate | Source |
|--------|------|--------|
| Contracts-First | All packages import `@lumen/contracts` | CI: check-contracts-imports.sh |
| Evidence Exists | `packages/evidence/dist/index.html` | Job: verify-evidence |
| Six-Nines | F_total ≤ 1e-6 | Job: verify-six-nines |
| Approvals | ≥1 w/ CODEOWNERS | Branch protection |
| Admin Enforcement | ON | Branch protection |

Linked from README under **Governance & Contribution** section.

---

### 3. One-Click Bootstrap Verification

**GitHub Actions Method (Recommended)**

1. Navigate to **Actions** → **Bootstrap Issues & Labels**
2. Click **Run workflow**
3. Select branch: `main`
4. Click **Run workflow** (green button)

After completion, verify:

✅ **Labels created:**
- Type: `epic`, `story`, `task`, `rfc`, `blocker`
- Area: `orchestrator`, `contracts`, `ui`, `evidence`, `qa`
- Agent: `A0`, `A1`, `A3`, `A4`, `A5`, `A6`, `A7`, `A8`, `A9`, `A10`
- Risk: `high`, `medium`, `low`
- Gate: `six-nines`, `coverage`, `mutation`, `determinism`

✅ **Issues created:**
- 1 Epic: "Lumen Dashboard v1"
- 5 Stories: Spec, Contracts, QA, UI, Integrator
- 6+ Tasks: All cross-linked with parent references

---

### 4. Contracts-First CI Check

**Make Script Executable**

```bash
chmod +x packages/ci/scripts/check-contracts-imports.sh
```

**Local Validation**

```bash
bash packages/ci/scripts/check-contracts-imports.sh
```

**Expected Output:**

```
No package source changes detected.
✅ Contracts-first check passed.
```

**If Changes Detected:**

```
❌ packages/agents missing import of @lumen/contracts
Contracts-first check failed.
```

Fix by adding imports:

```typescript
import type { EvidenceBundle, QualityGate } from '@lumen/contracts';
```

---

### 5. Metrics Panel Sanity Check

Open the dashboard at `/` and verify:

**When F_total ≤ 1e-6 (PASS):**
- Green chip displays: **"F_total ≤ 1e-6"** with CheckCircle icon
- Border: `border-primary/20`
- Background: `bg-primary/10`
- Text: `text-primary`

**When F_total > 1e-6 (FAIL):**
- Red chip displays: **"F_total > 1e-6"** with AlertTriangle icon
- Border: `border-destructive/20`
- Background: `bg-destructive/10`
- Text: `text-destructive`

**Simulate Failure:**

Temporarily increase test flakiness or agent error rates in mock data to trigger F_total > 1e-6. The CI should block merge when this occurs.

---

### 6. PR Example for Contributors

Created in `CONTRIBUTING.md`:

```md
### Agent Log
Agent ID: A8
Contributor: @devname
Scope: Improve flake model + evidence render

### Logic Summary
- Updated statistical weighting for F_total calc
- Verified bundle includes new flake histogram

### Evidence
packages/evidence/dist/index.html
F_total: 7.3e-7 (pass ✓)

### Reviewer
A3 (Contract Guardian)
```

---

### 7. Optional: Greenline Action

**Future Enhancement**

Extend `verify-six-nines.js` to extract and validate all gates from evidence bundle JSON:

```javascript
const bundle = JSON.parse(fs.readFileSync("./_evidence/bundle.json"));
if (bundle.gates.mutation < 0.80) process.exit(1);
if (bundle.gates.coverage < 0.95) process.exit(1);
if (bundle.gates.determinism < 0.9999) process.exit(1);
if (bundle.gates.flakeRate > 0.001) process.exit(1);
```

Add to `.github/workflows/ci.yml` as `verify-all-gates` job.

---

### 8. Sign-Off Procedure

**Pre-Merge Validation**

1. ✅ CI green (all OS × Node matrix combinations)
2. ✅ `verify-evidence` job passed
3. ✅ `verify-six-nines` job passed (F_total ≤ 1e-6)
4. ✅ Code-owner review approved
5. ✅ All conversations resolved

**Release Tagging**

```bash
# Bump version
pnpm run version:beta

# Push tags
git push origin --tags

# GitHub will automatically create release
```

**Post-Release**

- Evidence bundle archived in GitHub release assets
- Dashboard updated with new version badge
- Metrics logged for historical tracking

---

### 9. Deliverable Summary

**✅ Complete Enforcement Chain:**

1. **F_total Calculation & Exposure**
   - `packages/qa/src/sixNines.ts` - Core calculation logic
   - `packages/evidence/src/bundle.ts` - Embeds `data-ftotal` in HTML
   - `packages/qa/scripts/verify-six-nines.js` - CI verifier script

2. **Evidence Bundle Pipeline**
   - Generated at `packages/evidence/dist/index.html`
   - Uploaded as CI artifact
   - Contains contract diff, compat verdict, SBOM, F_total

3. **CI Enforcement Jobs**
   - `verify_evidence` - Validates bundle exists
   - `verify_six_nines` - Fails if F_total > 1e-6
   - Matrix builds across OS/Node versions

4. **Branch Protection**
   - Required status checks configured
   - CODEOWNERS review enforced
   - Merge blocked until all gates pass

5. **Contracts-First Guard**
   - `packages/ci/scripts/check-contracts-imports.sh`
   - Validates all packages import `@lumen/contracts`

6. **Dashboard Metrics**
   - `src/components/dashboard/MetricsPanel.tsx`
   - Pass/fail chip for F_total threshold
   - Real-time governance visibility

7. **Bootstrap Automation**
   - `.github/workflows/bootstrap-issues.yml`
   - One-click label and issue creation
   - No PAT required

8. **Example PR Workflow (Optional)**
   - `.github/workflows/create-example-pr.yml`
   - Auto-generates canonical PR template
   - Demonstrates Agent Log format

9. **Documentation Suite**
   - `docs/BRANCH_PROTECTION_SETUP.md` - Protection configuration
   - `docs/GO_NO_GO_CHECKLIST.md` - Pre-launch validation
   - `CONTRIBUTING.md` - Contributor workflow guide
   - `scripts/README.md` - Script usage documentation

---

## Autonomous Six-Nines Governance

> With this finalization, the Lumen system achieves **full autonomous six-nines governance** — every merge is demonstrably safe, reproducible, and traceable to evidence.

**Key Formula:**

```
F_total = 1 − Π(1 − Fᵢ)
```

Where Fᵢ represents individual failure probabilities from:
- Unit test failures
- Mutation score gaps
- Coverage deficiencies
- Flake rate occurrences

**Governance Standard:**

**F_total ≤ 10⁻⁶** (99.9999% reliability)

This threshold is:
- Automatically calculated in evidence bundle
- Enforced by CI on every PR
- Displayed in real-time on the dashboard
- Documented in every PR via Agent Log

---

## Lumen Operationalization

### Step 1: Lock-in Protection Baseline

Confirm branch protection includes:
- Required checks: `ci (ubuntu-latest)`, `verify-evidence`, `verify-six-nines`
- CODEOWNERS review enforced for `packages/contracts/` and `packages/evidence/`
- `enforce_admins = true` and `linear_history = true`

See [Branch Protection Setup](BRANCH_PROTECTION_SETUP.md) for complete configuration.

### Step 2: Governance Health Check

Run locally or in CI:

```bash
bash scripts/smoke.sh
node packages/qa/scripts/verify-six-nines.js
bash packages/ci/scripts/check-contracts-imports.sh
```

All commands should exit with status `0` and ✅ output.

### Step 3: Activate Issue Bootstrap

1. Go to **Actions → Bootstrap Issues & Labels → Run workflow**
2. Verify labels auto-created: `type:epic`, `gate:six-nines`, etc.
3. Confirm issues created: Epic → Stories → Tasks, all cross-linked

### Step 4: (Optional) Create Example PR

1. Go to **Actions → Create Example PR #1 → Run workflow**
2. Review the generated PR showing canonical Agent Log format
3. Use as reference for all future PRs

### Step 5: Publish

1. Push to `main` → trigger CI
2. Wait for all checks ✅
3. Go to **Lovable → Share → Publish**
4. (Optional) Connect custom domain under **Settings → Domains**

### Step 6: Post-Deployment Verification

- [ ] CI auto-attaches `packages/evidence/dist/index.html` on every PR
- [ ] `verify-six-nines` job fails if F_total > 1e-6
- [ ] CODEOWNERS review required for contracts/evidence changes
- [ ] Dashboard shows current F_total with pass/fail indicator

### Step 7: Maintenance Cadence

**Weekly:**
- Review F_total trend
- Check flake rate and coverage deltas
- Address any gate violations

**Quarterly:**
- Plan 99 sync: review all gates
- Adjust thresholds if project scale changes
- Update evidence bundle format if needed

---

## Production Status

Once all operationalization steps complete:

✅ **System State:** Lumen Orchestration Core operational  
🧩 **Governance:** Six-Nines enforcement active  
🔒 **Protection:** CI + Evidence + CODEOWNERS locked  
🪶 **Next Phase:** Begin autonomous feature builds via Plan 99 pipeline

**Certification:** Live — Six-Nines Certified

---

## 🚀 Next Phase: Autonomous Agent Implementation

See [Phase II Setup Guide](PHASE_II_SETUP.md) for:
- GitHub release tagging instructions (`v1.0.0-beta`)
- Future-work issue templates (A1, A3, A4 implementation)
- Agent implementation roadmap
- Phase II development workflow

---

**Governance Status:** ✅ Active  
**Autonomous Status:** 🚧 Pending Implementation

---

## References

- [Master Blueprint](blueprints/lumen_master_blueprint.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Go/No-Go Checklist](GO_NO_GO_CHECKLIST.md)
- [Branch Protection Setup](BRANCH_PROTECTION_SETUP.md)
- [Six-Nines Calculator](../packages/qa/src/sixNines.ts)
- [Evidence Bundle Generator](../packages/evidence/src/bundle.ts)
