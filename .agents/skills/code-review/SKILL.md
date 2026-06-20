---
name: code-review
description: Review changed code for correctness, architecture, security, contracts, tests, and maintainability.
---

# Code Review

## Review Checks

- Correctness and edge cases.
- Lumina architecture boundaries.
- Security, secrets, auth, token handling, and logging.
- API request/response contracts.
- Type safety and validation.
- Error handling and user-safe messages.
- Test coverage and verification.
- Maintainability and unnecessary complexity.
- Overengineering or unrelated rewrites.

## Workflow

1. Read `AGENTS.md`.
2. Inspect `git diff` or the submitted patch.
3. Read exact source files around changed code.
4. Cross-check relevant docs and tests.
5. Report findings first, ordered by severity, with file/line references.
6. Mention test gaps or residual risk.
