#!/usr/bin/env bash
set -euo pipefail
CHANGED=$(git diff --name-only origin/main...HEAD | grep -E '^packages/[^/]+/src/.*\.(ts|tsx)$' || true)
if [ -z "$CHANGED" ]; then
  echo "No package source changes detected."
  exit 0
fi
MISSING=0
for pkg in $(echo "$CHANGED" | cut -d/ -f2 | sort -u); do
  if ! grep -R "@lumen/contracts" "packages/$pkg/src" >/dev/null 2>&1; then
    echo "❌ packages/$pkg missing import of @lumen/contracts"
    MISSING=1
  fi
done
if [ $MISSING -eq 1 ]; then
  echo "Contracts-first check failed."
  exit 1
fi
echo "✅ Contracts-first check passed."
