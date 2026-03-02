#!/usr/bin/env bash
set -euo pipefail
echo "🔥 Running Lumen smoke test..."
echo ""
echo "📦 Building all packages..."
pnpm -r build
echo ""
echo "🔍 Linting and type-checking..."
pnpm -r lint && pnpm -r typecheck
echo ""
echo "🧪 Running tests..."
pnpm -r test:unit
pnpm -r test:property
pnpm -r test:mutation
echo ""
echo "⚡ Quality assurance..."
pnpm -r qa:perf
pnpm -r qa:security
echo ""
echo "📊 Generating evidence bundle..."
pnpm -r evidence:bundle
echo ""
echo "✅ Smoke test complete!"
echo "📖 Open packages/evidence/dist/index.html to review evidence"
