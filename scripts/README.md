# Lumen Scripts

Automation and utility scripts for Lumen project management.

## bootstrap_lumen_issues.sh

Creates GitHub issue structure for Lumen development including labels, epics, stories, and tasks.

### Prerequisites

- GitHub personal access token with `repo` scope
- `jq` installed (`brew install jq` on macOS)
- `curl` available

### Usage

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

## Contributing

Add new scripts here following the pattern:
- Prefix with clear action verb
- Include inline documentation
- Add usage section to this README
