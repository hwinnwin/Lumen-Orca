# Lumen Scripts

Automation and utility scripts for Lumen project management.

## Quick Start

```bash
chmod +x scripts/bootstrap_lumen_issues.sh
chmod +x scripts/smoke.sh
```

## bootstrap_lumen_issues.sh

Creates GitHub issue structure for Lumen development including labels, epics, stories, and tasks.

### Prerequisites

- GitHub personal access token with `repo` scope
- `jq` installed (`brew install jq` on macOS)
- `curl` available

### Usage

**Option 1: GitHub Actions (no token needed)**

Actions → "Bootstrap Issues & Labels" → Run workflow

**Option 2: Local CLI (requires PAT with repo scope)**

```bash
export GITHUB_TOKEN="ghp_your_token_here"
export OWNER="hwinnwin"
export REPO="lumen-sentinel-nexus"

bash scripts/bootstrap_lumen_issues.sh
```

### What it creates

**Labels:**
- Type labels: `epic`, `story`, `task`, `rfc`, `blocker`
- Area labels: `orchestrator`, `contracts`, `ui`, `evidence`, `qa`
- Agent labels: `A0` through `A10`
- Risk labels: `high`, `medium`, `low`
- Gate labels: `six-nines`, `coverage`, `mutation`, `determinism`

**Issues:**
- 1 Epic: Dashboard v1
- 5 Stories: Spec, Contracts, QA, UI, Integrator
- 6+ Tasks linked to stories with cross-references

All issues are linked via parent-child references in the description.

### GitHub CLI Alternative

If you prefer `gh` CLI over REST API:

```bash
# Install gh CLI if needed
brew install gh

# Authenticate
gh auth login

# Create labels
gh label create "type: epic" --color 7B61FF --description "Top-level outcome"

# Create issues
gh issue create --title "Epic: Dashboard v1" --body "..." --label "type: epic"
```

## smoke.sh

Runs the full Lumen test and quality pipeline locally.

### Usage

```bash
bash scripts/smoke.sh
```

Executes:
- Build all packages
- Lint + typecheck
- Unit/property/mutation tests
- Performance + security QA
- Evidence bundle generation

Opens `packages/evidence/dist/index.html` for review.

## Contributing

Add new scripts here following the pattern:
- Prefix with clear action verb
- Include inline documentation
- Add usage section to this README
