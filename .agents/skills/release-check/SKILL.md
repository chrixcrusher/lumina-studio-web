---
name: release-check
description: Prepare LuminaStudio Web code for merge or release with verification, docs, env, and deployment checks.
---

# Release Check

## Checklist

- Lint.
- Typecheck.
- Unit/component/contract tests.
- Build.
- E2E tests for critical browser workflows when needed.
- Docs updated.
- Changelog or release notes if applicable.
- Environment variables reviewed.
- Deployment notes checked.
- No secrets or generated analysis outputs staged.

## Commands

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run test:e2e --workspace frontend`

## Output

- Commands run and results.
- Commands not run and why.
- Release risks.
- Required follow-ups.
