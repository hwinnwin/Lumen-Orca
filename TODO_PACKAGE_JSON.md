# TODO: Root package.json Setup

**Maintainer action required** — Lovable cannot modify the root `package.json` automatically.

## Required Changes

Add the following to the root `package.json`:

### 1. Workspaces

```json
{
  "workspaces": [
    "packages/*"
  ]
}
```

### 2. Scripts (Turbo)

```json
{
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test:unit": "turbo run test:unit",
    "test:property": "turbo run test:property",
    "test:mutation": "turbo run test:mutation",
    "qa:perf": "turbo run qa:perf",
    "qa:security": "turbo run qa:security",
    "evidence:bundle": "turbo run evidence:bundle"
  }
}
```

## Fallback (Until Fixed)

All CI steps can call Turbo via:

```bash
pnpm dlx turbo run <task>
```

This fallback is already configured in `.github/workflows/ci.yml`.

## Reference

See `/docs/blueprints/lumen_master_blueprint.md` §"Repo morph → Monorepo" for full context.
