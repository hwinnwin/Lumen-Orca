# Branch Protection Setup

Enforce quality gates and evidence artifacts before merging to `main`.

## GitHub UI Method

1. Go to **Settings** → **Branches** → **Add branch protection rule**
2. Branch name pattern: `main`
3. Enable the following:

### Required Status Checks
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- Select these checks:
  - `matrix (ubuntu-latest, 20)` _(or your primary OS/Node combination)_
  - `setup`
  - `verify-evidence`
  - `verify-six-nines`

### Required Reviews
- ✅ Require a pull request before merging
- ✅ Require approvals: 1
- ✅ Dismiss stale pull request approvals when new commits are pushed

### Additional Settings
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings

## GitHub API Method

Use this script to programmatically set branch protection:

```bash
#!/usr/bin/env bash
set -euo pipefail

: "${GITHUB_TOKEN:?Set GITHUB_TOKEN}"
: "${OWNER:?Set OWNER}"
: "${REPO:?Set REPO}"

curl -X PUT \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/${OWNER}/${REPO}/branches/main/protection" \
  -d '{
    "required_status_checks": {
      "strict": true,
      "contexts": [
        "matrix (ubuntu-latest, 20)",
        "setup",
        "verify-evidence",
        "verify-six-nines"
      ]
    },
    "enforce_admins": false,
    "required_pull_request_reviews": {
      "dismiss_stale_reviews": true,
      "require_code_owner_reviews": false,
      "required_approving_review_count": 1
    },
    "restrictions": null,
    "required_conversation_resolution": true,
    "allow_force_pushes": false,
    "allow_deletions": false
  }'
```

Save as `scripts/setup_branch_protection.sh` and run:

```bash
export GITHUB_TOKEN="ghp_xxx"
export OWNER="org-or-user"
export REPO="lumen-sentinel-nexus"
bash scripts/setup_branch_protection.sh
```

## Enforce Evidence Artifact

To require the evidence bundle artifact, add a **required status check** that validates the artifact exists:

### Implemented in CI

The CI workflow now includes two enforcement jobs:

1. **`verify_evidence`** - Downloads and validates evidence bundle artifact exists
2. **`verify_six_nines`** - Parses evidence bundle and fails if F_total > 1e-6

Add both `verify-evidence` and `verify-six-nines` to required status checks in branch protection.

### Option 2: CODEOWNERS Review

Create `.github/CODEOWNERS`:

```
# Evidence bundle changes require A3 (Contract Guardian) review
packages/evidence/ @contract-guardian-team

# Contracts require strict review
packages/contracts/ @contract-guardian-team @qa-team
```

## Six-Nines Gate Enforcement

The CI includes a dedicated `verify_six_nines` job that:
- Downloads the evidence bundle artifact
- Runs `packages/qa/scripts/verify-six-nines.js` to parse `data-ftotal` attribute
- Fails the build if F_total > 1e-6

The evidence bundle generator must embed the F_total value as a data attribute:
```html
<div data-ftotal="0.000000123">F_total: 1.23e-7</div>
```

## Validation

After setup, test by creating a PR:

1. CI should run all matrix builds
2. Evidence bundle should be uploaded as artifact
3. Merge button should be disabled until:
   - All checks pass
   - Evidence artifact exists
   - 1 approval received
   - All conversations resolved

## Reference

- [GitHub Branch Protection Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Status Checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
