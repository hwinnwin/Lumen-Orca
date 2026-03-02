#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# Create GitHub Issues for Lumen Phase II Epic
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

echo "🎯 Creating Lumen Phase II Work Package Issues..."
echo ""

# Ensure GH CLI is authenticated
if ! gh auth status &>/dev/null; then
  echo "❌ GitHub CLI not authenticated. Run 'gh auth login' first."
  exit 1
fi

# ─────────────────────────────────────────────────────────────────
# EPIC ISSUE
# ─────────────────────────────────────────────────────────────────
echo "📦 Creating Epic Issue..."
EPIC_BODY=$(cat <<'EOF'
## 🎯 Objective

Implement Phase II upgrades to enable flexible LLM provider routing, cost monitoring, AAA/AA/A frontend grading, and full governance preservation.

## 📋 Work Packages

- [ ] #ISSUE_1 — Multi-Provider LLM Routing Layer
- [ ] #ISSUE_2 — LLM Settings Control Panel
- [ ] #ISSUE_3 — AAA/AA/A Grading System
- [ ] #ISSUE_4 — Dashboard Enhancements
- [ ] #ISSUE_5 — Documentation Updates

## ✅ Deliverables

- Multi-provider LLM infrastructure (Lovable, OpenAI, Anthropic, Google)
- Cost/budget tracking database and UI
- AAA/AA/A public metric display with backend precision
- Settings dashboard (global & per-agent configuration)
- Updated metrics and agent dashboards
- Documentation and environment variables

## 📊 Success Metrics

| Metric | Target |
|--------|--------|
| Provider Switch Latency | < 250ms |
| Cost Accuracy | ±5% |
| Fallback Success Rate | ≥ 99% |
| Governance Enforcement | 100% |
| UI Comprehension | ≥ 90% |

## 📚 References

- [Epic Manifest](../docs/epics/lumen_phase_ii_upgrade.yaml)
- [LLM Provider System Docs](../docs/LLM_PROVIDER_SYSTEM.md)
- [Grading System Docs](../docs/GRADING_SYSTEM.md)
EOF
)

EPIC_URL=$(gh issue create \
  --title "Epic: Lumen Phase II — Multi-Provider & Governance Enhancements" \
  --body "$EPIC_BODY" \
  --label "type:epic,area:orchestrator,priority:high" \
  --web) || true

EPIC_NUMBER=$(echo "$EPIC_URL" | grep -oP '\d+$')
echo "✅ Epic created: #$EPIC_NUMBER"
echo ""

# ─────────────────────────────────────────────────────────────────
# WORK PACKAGE 1: Multi-Provider LLM Routing Layer
# ─────────────────────────────────────────────────────────────────
echo "📦 Creating Work Package 1: LLM Routing Layer..."
WP1_BODY=$(cat <<EOF
## 📋 Tasks

- [ ] Build \`supabase/functions/llm-proxy/\` folder with provider handlers
- [ ] Create database tables: \`llm_configurations\`, \`llm_usage_logs\`, \`budget_settings\`
- [ ] Implement token usage logging + cost estimation
- [ ] Integrate Lovable AI as default provider
- [ ] Add OpenAI, Anthropic, Google provider support
- [ ] Implement fallback routing and error recovery
- [ ] Maintain Six-Nines reliability tracking

## 🔗 Related

Part of Epic #$EPIC_NUMBER

## 📚 References

- [LLM Provider System Docs](../docs/LLM_PROVIDER_SYSTEM.md)
EOF
)

WP1_URL=$(gh issue create \
  --title "WP1: Multi-Provider LLM Routing Layer" \
  --body "$WP1_BODY" \
  --label "type:story,area:orchestrator,agent:A0,agent:A1,agent:A6" \
  --web) || true

WP1_NUMBER=$(echo "$WP1_URL" | grep -oP '\d+$')
echo "✅ Work Package 1 created: #$WP1_NUMBER"
echo ""

# ─────────────────────────────────────────────────────────────────
# WORK PACKAGE 2: LLM Settings Control Panel
# ─────────────────────────────────────────────────────────────────
echo "📦 Creating Work Package 2: Settings UI..."
WP2_BODY=$(cat <<EOF
## 📋 Tasks

- [ ] Create \`/src/pages/Settings.tsx\`
- [ ] Implement global provider toggle + per-agent overrides
- [ ] Add model dropdowns, fallback toggles, budget inputs
- [ ] Integrate Recharts analytics and progress bars
- [ ] Add secure API key vault UI (Supabase secrets)
- [ ] Style with Lumen design system colors & typography

## 🔗 Related

Part of Epic #$EPIC_NUMBER

## 📚 References

- [Settings Page Implementation](../src/pages/Settings.tsx)
EOF
)

WP2_URL=$(gh issue create \
  --title "WP2: LLM Settings Control Panel" \
  --body "$WP2_BODY" \
  --label "type:story,area:ui,agent:A4,agent:A5,agent:A7" \
  --web) || true

WP2_NUMBER=$(echo "$WP2_URL" | grep -oP '\d+$')
echo "✅ Work Package 2 created: #$WP2_NUMBER"
echo ""

# ─────────────────────────────────────────────────────────────────
# WORK PACKAGE 3: AAA/AA/A Grading System
# ─────────────────────────────────────────────────────────────────
echo "📦 Creating Work Package 3: Grading System..."
WP3_BODY=$(cat <<EOF
## 📋 Tasks

- [ ] Create \`gradeBands.ts\` and \`applyGrades.ts\`
- [ ] Compute grades server-side, hide raw numbers from public API
- [ ] Add \`/api/metrics/public\` and \`/api/metrics/admin\` endpoints
- [ ] Update dashboard components (\`MetricsPanel\`, \`AgentStatusGrid\`)
- [ ] Add \`GradeBadge.tsx\` component with color-coded labels
- [ ] Implement feature flag: \`.env LUMEN_METRICS_EXPOSE\`

## 🎯 Grading Thresholds

| Grade | Coverage | Mutation | Determinism | Flake | Reliability |
|-------|----------|----------|-------------|-------|-------------|
| AAA   | ≥95%     | ≥0.90    | ≥99.99%     | ≤0.10%| ≤1e-6       |
| AA    | ≥90%     | ≥0.87    | ≥99.9%      | ≤0.50%| ≤1e-5       |
| A     | ≥85%     | ≥0.80    | ≥99.5%      | ≤1.0% | ≤1e-4       |

## 🔗 Related

Part of Epic #$EPIC_NUMBER

## 📚 References

- [Grading System Docs](../docs/GRADING_SYSTEM.md)
EOF
)

WP3_URL=$(gh issue create \
  --title "WP3: AAA/AA/A Grading System" \
  --body "$WP3_BODY" \
  --label "type:story,area:qa,agent:A6,agent:A7,agent:A9" \
  --web) || true

WP3_NUMBER=$(echo "$WP3_URL" | grep -oP '\d+$')
echo "✅ Work Package 3 created: #$WP3_NUMBER"
echo ""

# ─────────────────────────────────────────────────────────────────
# WORK PACKAGE 4: Dashboard Enhancements
# ─────────────────────────────────────────────────────────────────
echo "📦 Creating Work Package 4: Dashboard Upgrades..."
WP4_BODY=$(cat <<EOF
## 📋 Tasks

- [ ] Integrate provider icons, cost counters, and grade badges
- [ ] Add budget alerts (amber 80%, red 95%)
- [ ] Display provider badge & model info per agent
- [ ] Include F_total overlay and Six-Nines pass/fail indicator
- [ ] Update \`MetricsPanel\` with graded view
- [ ] Create \`ProviderBadge\` component

## 🔗 Related

Part of Epic #$EPIC_NUMBER

## 📚 References

- [MetricsPanel Component](../src/components/dashboard/MetricsPanel.tsx)
- [ProviderBadge Component](../src/components/dashboard/ProviderBadge.tsx)
EOF
)

WP4_URL=$(gh issue create \
  --title "WP4: Dashboard Enhancements" \
  --body "$WP4_BODY" \
  --label "type:story,area:ui,agent:A4,agent:A5,agent:A8" \
  --web) || true

WP4_NUMBER=$(echo "$WP4_URL" | grep -oP '\d+$')
echo "✅ Work Package 4 created: #$WP4_NUMBER"
echo ""

# ─────────────────────────────────────────────────────────────────
# WORK PACKAGE 5: Documentation Updates
# ─────────────────────────────────────────────────────────────────
echo "📦 Creating Work Package 5: Documentation..."
WP5_BODY=$(cat <<EOF
## 📋 Tasks

- [ ] Add \`docs/LLM_PROVIDER_SYSTEM.md\`
- [ ] Add \`docs/GRADING_SYSTEM.md\`
- [ ] Update \`OPERATIONAL_STATUS.md\`
- [ ] Update \`FINALIZATION.md\`
- [ ] Document env vars (\`NEXT_PUBLIC_SHOW_NUMERIC\`, \`LUMEN_METRICS_EXPOSE\`)
- [ ] Provide manual steps for ops team in Lovable UI

## 🔗 Related

Part of Epic #$EPIC_NUMBER

## 📚 References

- [LLM Provider System Docs](../docs/LLM_PROVIDER_SYSTEM.md)
- [Grading System Docs](../docs/GRADING_SYSTEM.md)
EOF
)

WP5_URL=$(gh issue create \
  --title "WP5: Documentation Updates" \
  --body "$WP5_BODY" \
  --label "type:task,area:docs,agent:A1,agent:A2" \
  --web) || true

WP5_NUMBER=$(echo "$WP5_URL" | grep -oP '\d+$')
echo "✅ Work Package 5 created: #$WP5_NUMBER"
echo ""

# ─────────────────────────────────────────────────────────────────
# UPDATE EPIC WITH ISSUE LINKS
# ─────────────────────────────────────────────────────────────────
echo "🔗 Updating Epic with work package links..."
UPDATED_EPIC_BODY=$(cat <<EOF
## 🎯 Objective

Implement Phase II upgrades to enable flexible LLM provider routing, cost monitoring, AAA/AA/A frontend grading, and full governance preservation.

## 📋 Work Packages

- [ ] #$WP1_NUMBER — Multi-Provider LLM Routing Layer
- [ ] #$WP2_NUMBER — LLM Settings Control Panel
- [ ] #$WP3_NUMBER — AAA/AA/A Grading System
- [ ] #$WP4_NUMBER — Dashboard Enhancements
- [ ] #$WP5_NUMBER — Documentation Updates

## ✅ Deliverables

- Multi-provider LLM infrastructure (Lovable, OpenAI, Anthropic, Google)
- Cost/budget tracking database and UI
- AAA/AA/A public metric display with backend precision
- Settings dashboard (global & per-agent configuration)
- Updated metrics and agent dashboards
- Documentation and environment variables

## 📊 Success Metrics

| Metric | Target |
|--------|--------|
| Provider Switch Latency | < 250ms |
| Cost Accuracy | ±5% |
| Fallback Success Rate | ≥ 99% |
| Governance Enforcement | 100% |
| UI Comprehension | ≥ 90% |

## 📚 References

- [Epic Manifest](../docs/epics/lumen_phase_ii_upgrade.yaml)
- [LLM Provider System Docs](../docs/LLM_PROVIDER_SYSTEM.md)
- [Grading System Docs](../docs/GRADING_SYSTEM.md)
EOF
)

gh issue edit "$EPIC_NUMBER" --body "$UPDATED_EPIC_BODY" || true

echo ""
echo "✅ Phase II Epic and Work Packages created successfully!"
echo ""
echo "📊 Summary:"
echo "  Epic: #$EPIC_NUMBER"
echo "  WP1 (LLM Routing): #$WP1_NUMBER"
echo "  WP2 (Settings UI): #$WP2_NUMBER"
echo "  WP3 (Grading System): #$WP3_NUMBER"
echo "  WP4 (Dashboard): #$WP4_NUMBER"
echo "  WP5 (Documentation): #$WP5_NUMBER"
echo ""
echo "🔗 View Epic: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/issues/$EPIC_NUMBER"
echo ""
echo "🎯 Next Steps:"
echo "  1. Review and refine work package tasks"
echo "  2. Assign team members to issues"
echo "  3. Track progress via Epic checklist"
echo "  4. Update issue status as work completes"
