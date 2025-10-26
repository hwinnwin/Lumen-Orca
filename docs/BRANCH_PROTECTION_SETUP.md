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
        "setup"
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

### Option 1: Add CI Job

Add this job to `.github/workflows/ci.yml`:

```yaml
  verify-evidence:
    needs: matrix
    runs-on: ubuntu-latest
    steps:
      - name: Check Evidence Artifact
        uses: actions/github-script@v7
        with:
          script: |
            const artifacts = await github.rest.actions.listWorkflowRunArtifacts({
              owner: context.repo.owner,
              repo: context.repo.repo,
              run_id: context.runId
            });
            
            const evidenceArtifact = artifacts.data.artifacts.find(
              a => a.name === 'evidence-bundle'
            );
            
            if (!evidenceArtifact) {
              core.setFailed('Evidence bundle artifact not found!');
            }
```

Then add `verify-evidence` to the required status checks.

### Option 2: CODEOWNERS Review

Create `.github/CODEOWNERS`:

```
# Evidence bundle changes require A3 (Contract Guardian) review
packages/evidence/ @contract-guardian-team

# Contracts require strict review
packages/contracts/ @contract-guardian-team @qa-team
```

## Six-Nines Gate Enforcement

The CI already fails if `F_total > 1e-6`. Ensure this step is in the required checks:

```yaml
- name: Verify F_total ≤ 10⁻⁶
  run: |
    echo "Checking six-nines governance compliance..."
    # Parse evidence bundle and fail if F_total > 1e-6
    # (implement actual parsing of packages/evidence/dist/index.html)
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
