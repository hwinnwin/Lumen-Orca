#!/usr/bin/env bash
set -euo pipefail

# ========= CONFIG =========
: "${GITHUB_TOKEN:?Set GITHUB_TOKEN env var (classic token with repo scope)}"
: "${OWNER:?Set OWNER env var, e.g. export OWNER='your-gh-handle'}"
: "${REPO:?Set REPO env var, e.g. export REPO='lumen'}"

API="https://api.github.com"
HDR=(-H "Authorization: Bearer ${GITHUB_TOKEN}" -H "Accept: application/vnd.github+json")

# Helper: POST JSON
post() { curl -sS -X POST "${HDR[@]}" "$1" -d "$2"; }

# Helper: create label if not exists
create_label () {
  local name="$1" color="$2" desc="${3:-}"
  echo "Creating label: ${name}"
  curl -sS -o /dev/null -w "%{http_code}\n" -X POST "${HDR[@]}" \
    "${API}/repos/${OWNER}/${REPO}/labels" \
    -d "$(jq -nc --arg name "$name" --arg color "$color" --arg desc "$desc" \
          '{name:$name,color:$color,description:$desc}')" \
    | grep -E "^(200|201)$" >/dev/null || true
}

# ---------- 1) LABELS ----------
# Core types
create_label "type: epic"     "7B61FF" "Top-level outcome"
create_label "type: story"    "5EBA7D" "User-facing capability"
create_label "type: task"     "58A6FF" "Executable step"
create_label "type: rfc"      "FF8A65" "Collaborative design thread"
create_label "type: blocker"  "E11D48" "Incident / escalation"

# Areas
create_label "area: orchestrator" "BFD4F2" "A0 + DAG + arbitration"
create_label "area: contracts"    "C2F0C2" "Schemas + compat tests"
create_label "area: ui"           "C7F9CC" "Dashboard + DS"
create_label "area: evidence"     "FFD166" "Evidence bundle + reports"
create_label "area: qa"           "81B29A" "Mutation / property / fuzz"

# Agents
for a in {0..10}; do
  create_label "agent: A${a}" "9CA3AF" "Agent A${a}"
done

# Risk + gates
create_label "risk: high"    "D73A49" "High risk change"
create_label "risk: medium"  "FBCA04" "Medium risk"
create_label "risk: low"     "0E8A16" "Low risk"

create_label "gate: six-nines"   "00B894" "F_total ≤ 1e-6"
create_label "gate: coverage"    "27AE60" "≥95% critical"
create_label "gate: mutation"    "F39C12" "≥0.80 critical"
create_label "gate: determinism" "0984E3" ">99.99%"

# ---------- 2) EPIC ----------
EPIC_TITLE="Epic: Lumen Dashboard v1 — Precision Orchestration Instrument"
EPIC_BODY=$'**Goal**\n- 3-column dashboard (nav / orchestration DAG / telemetry) rendered from mock data\n- Evidence Bundle generated in CI for the PR\n- Six-Nines calc displayed on Metrics Panel (**F_total**)\n\n**Acceptance Criteria**\n- Contracts in `@lumen/contracts` for AgentStatus & OrchestrationEdge\n- Property & fuzz tests pass for data invariants\n- Metrics panel shows determinism, mutation, coverage, F_total\n\n**Labels**: `type: epic`, `area: ui`, `gate: six-nines`'

EPIC_JSON="$(jq -nc --arg title "$EPIC_TITLE" --arg body "$EPIC_BODY" \
  --argjson labels '["type: epic","area: ui","gate: six-nines"]' \
  '{title:$title,body:$body,labels:$labels}')"

echo "Creating Epic…"
EPIC_RESP="$(post "${API}/repos/${OWNER}/${REPO}/issues" "$EPIC_JSON")"
EPIC_NUM="$(echo "$EPIC_RESP" | jq -r '.number')"
echo "Epic #${EPIC_NUM} created."

# ---------- 3) STORIES ----------
declare -A STORY_TITLES
declare -A STORY_BODIES
declare -A STORY_LABELS

STORY_TITLES[spec]="Story: A1 Spec → Technical spec + AC for Dashboard v1"
STORY_BODIES[spec]=$"Parent Epic: #${EPIC_NUM}\n\nAC:\n- UI map, data contracts (AgentStatus, Edge, Metrics)\n- Test plan outline"
STORY_LABELS[spec]='["type: story","agent: A1","area: ui"]'

STORY_TITLES[contracts]="Story: A3 Contracts → Define/validate dashboard contracts"
STORY_BODIES[contracts]=$"Parent Epic: #${EPIC_NUM}\n\nAC:\n- JSON Schemas for AgentStatus & OrchestrationEdge\n- Golden fixtures + compat tests in @lumen/contracts"
STORY_LABELS[contracts]='["type: story","agent: A3","area: contracts"]'

STORY_TITLES[qa]="Story: A5 Test → Unit + property scaffolds for UI data"
STORY_BODIES[qa]=$"Parent Epic: #${EPIC_NUM}\n\nAC:\n- Property tests for DAG edges & status transitions\n- Fuzz for payloads"
STORY_LABELS[qa]='["type: story","agent: A5","area: qa"]'

STORY_TITLES[ui]="Story: A4 Generator → Implement Dashboard views"
STORY_BODIES[ui]=$"Parent Epic: #${EPIC_NUM}\n\nAC:\n- Agent Grid pulses (easeInOutQuint), DAG render\n- Metrics (determinism, mutation, coverage, F_total)"
STORY_LABELS[ui]='["type: story","agent: A4","area: ui"]'

STORY_TITLES[integrator]="Story: A8 Integrator → PR with Evidence Bundle"
STORY_BODIES[integrator]=$"Parent Epic: #${EPIC_NUM}\n\nAC:\n- Evidence HTML with unit/property/mutation/security/perf + contract diff + SBOM\n- Upload as CI artifact"
STORY_LABELS[integrator]='["type: story","agent: A8","area: evidence"]'

declare -A STORY_NUMS
for key in spec contracts qa ui integrator; do
  BODY="$(jq -nc --arg title "${STORY_TITLES[$key]}" --arg body "${STORY_BODIES[$key]}" \
           --argjson labels "${STORY_LABELS[$key]}" '{title:$title,body:$body,labels:$labels}')"
  echo "Creating ${key} story…"
  RESP="$(post "${API}/repos/${OWNER}/${REPO}/issues" "$BODY")"
  STORY_NUMS[$key]="$(echo "$RESP" | jq -r '.number')"
  echo "Story #${STORY_NUMS[$key]} created."
done

# ---------- 4) TASKS ----------
create_task () {
  local title="$1" body="$2" labels_json="$3"
  local json="$(jq -nc --arg title "$title" --arg body "$body" --argjson labels "$labels_json" \
                '{title:$title,body:$body,labels:$labels}')"
  post "${API}/repos/${OWNER}/${REPO}/issues" "$json" | jq -r '.number'
}

echo "Creating tasks…"
TASKS=()

TASKS+=("Task: Spec → UI contracts table + data flow diagram|||Parent Story: #${STORY_NUMS[spec]}||Definition of Done:\n- Contracts table & diagram committed under /docs\n- Linked to Epic #${EPIC_NUM}||[\"type: task\",\"agent: A1\",\"area: ui\"]")

TASKS+=("Task: Contracts → add agent-status.schema.json + fixtures|||Parent Story: #${STORY_NUMS[contracts]}||DoD:\n- Schema + golden fixtures\n- Compat tests green in @lumen/contracts||[\"type: task\",\"agent: A3\",\"area: contracts\",\"gate: coverage\"]")

TASKS+=("Task: QA → fast-check property tests for DAG invariants|||Parent Story: #${STORY_NUMS[qa]}||DoD:\n- Property tests written & passing\n- Fuzz suite added for edges/payloads||[\"type: task\",\"agent: A5\",\"area: qa\",\"gate: mutation\"]")

TASKS+=("Task: UI → Implement AgentStatusGrid pulses + tokens|||Parent Story: #${STORY_NUMS[ui]}||DoD:\n- Pulses (easeInOutQuint) and tokenized DS\n- Accessibility checked||[\"type: task\",\"agent: A4\",\"area: ui\"]")

TASKS+=("Task: UI → MetricsPanel F_total calc from sixNines.ts|||Parent Story: #${STORY_NUMS[ui]}||DoD:\n- F_total displayed with thresholds\n- Wiring to evidence mock||[\"type: task\",\"agent: A4\",\"area: ui\",\"gate: six-nines\"]")

TASKS+=("Task: Evidence → bundle script links all reports + contract diff|||Parent Story: #${STORY_NUMS[integrator]}||DoD:\n- Evidence HTML has unit/property/mutation/security/perf\n- Contract diff + SBOM included; uploaded in CI||[\"type: task\",\"agent: A8\",\"area: evidence\"]")

for t in "${TASKS[@]}"; do
  IFS="||" read -r title delim1 body delim2 labels_json <<< "$t"
  num="$(create_task "$title" "$body" "$labels_json")"
  echo "Task #$num created."
done

echo "✅ Done. Epic #${EPIC_NUM}, Stories #${STORY_NUMS[spec]},#${STORY_NUMS[contracts]},#${STORY_NUMS[qa]},#${STORY_NUMS[ui]},#${STORY_NUMS[integrator]} and tasks created."
