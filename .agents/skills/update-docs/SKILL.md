---
name: update-docs
description: Update project docs when behavior, architecture, API, database, deployment, testing, or AI workflow changes.
---

# Update Docs

## Docs To Consider

- `README.md`
- `docs/tdd/ls-web-tdd.md`
- `docs/api/ls-web-api_specification.md`
- `docs/database/ls-web-database-schema.md`
- `docs/project-structure/ls-web-project-structure.md`
- `docs/diagrams/ls-web-*.md`
- `docs/testing/ls-web-test-specification.md`
- `docs/deployment/free-deployment.md`
- `docs/ai/`
- Decision records if the change introduces lasting tradeoffs.

## Workflow

1. Identify what behavior or architecture changed.
2. Update canonical docs first.
3. Update dependent docs and diagrams.
4. Preserve Web MVP boundaries and naming constants.
5. Avoid inventing future desktop/offline requirements.
6. Note verification or doc-only rationale in the final summary.
