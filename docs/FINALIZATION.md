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

1. **F_total Exposed**
   - `data-ftotal` attribute in evidence HTML
   - Parseable by CI verification script
   - Displayed in Metrics Panel with pass/fail chip

2. **Evidence Bundle + CI**
   - Artifact uploaded on every PR
   - `verify-evidence` job validates presence
   - `verify-six-nines` job enforces F_total ≤ 1e-6

3. **CODEOWNERS**
   - Contracts package requires @contract-guardian-team
   - Evidence package requires strict review

4. **Branch Protection**
   - All CI checks required
   - Evidence artifact required
   - Six-nines gate enforced
   - 1+ approval mandatory
   - Admin enforcement enabled

5. **One-Click Bootstrap**
   - GitHub Actions workflow ready
   - No PAT needed for same-repo execution
   - Labels and issues auto-created

6. **Contracts-First Guard**
   - CI script validates imports
   - Fails build if contracts missing
   - Local validation available

7. **Dashboard Metrics**
   - F_total calculated from agent error rates
   - Pass/fail chip with semantic colors
   - Real-time orchestration state

8. **Governance Docs**
   - CONTRIBUTING.md with Agent Log format
   - GO_NO_GO_CHECKLIST.md for pre-launch
   - BRANCH_PROTECTION_SETUP.md for enforcement
   - FINALIZATION.md (this document)

9. **Smoke Test Scripts**
   - `scripts/smoke.sh` for full validation
   - `scripts/bootstrap_lumen_issues.sh` for issue setup
   - `packages/ci/scripts/check-contracts-imports.sh` for contract validation

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

## Next Steps

1. **Enable Branch Protection**
   - Follow [Branch Protection Setup](BRANCH_PROTECTION_SETUP.md)
   - Use GitHub UI or API/CLI methods provided

2. **Run Bootstrap Workflow**
   - Create issue structure
   - Validate labels and cross-references

3. **Create First PR**
   - Use CONTRIBUTING.md template
   - Verify all gates pass
   - Confirm enforcement chain works

4. **Monitor Metrics**
   - Watch dashboard for F_total trends
   - Track agent error rates
   - Review evidence bundles regularly

---

## References

- [Master Blueprint](blueprints/lumen_master_blueprint.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Go/No-Go Checklist](GO_NO_GO_CHECKLIST.md)
- [Branch Protection Setup](BRANCH_PROTECTION_SETUP.md)
- [Six-Nines Calculator](../packages/qa/src/sixNines.ts)
- [Evidence Bundle Generator](../packages/evidence/src/bundle.ts)
