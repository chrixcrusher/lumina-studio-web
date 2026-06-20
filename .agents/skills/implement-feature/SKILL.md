---
name: implement-feature
description: Turn a request or ticket into a safe LuminaStudio Web implementation.
---

# Implement Feature

## Workflow

1. Read `AGENTS.md`.
2. Read relevant docs, starting with `docs/tdd/ls-web-tdd.md`.
3. If using the development plan, update the ticket to `in_progress`.
4. Use context tools or `rg` to find candidate files.
5. Read exact source files, tests, and contracts before editing.
6. Plan the smallest implementation that fits existing patterns.
7. Implement small, reviewable changes.
8. Add or update tests.
9. Run relevant verification commands.
10. Update docs if behavior, API, database, deployment, or structure changes.
11. If a plan ticket is resolved, mark it `done`.
12. Summarize changes, verification, and remaining risk.

## Lumina Guardrails

- Browser-side manual editing stays in the frontend.
- Backend image processing is limited to `POST /api/v1/ai/restore-face`.
- User-provided Hugging Face tokens must be protected.
