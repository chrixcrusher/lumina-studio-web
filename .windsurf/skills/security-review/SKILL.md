---
name: security-review
description: Review secrets, auth, authorization, token storage, logging, uploads, external API calls, dependency risk, injection, XSS, and CSRF concerns.
---

# Security Review

## Workflow

1. Read `AGENTS.md` and the relevant exact files.
2. Identify sensitive data, trust boundaries, inputs, outputs, and external calls.
3. Check authentication, authorization, secret handling, logging, validation, dependencies, and file/process operations.
4. Rank findings by severity and likelihood.
5. Recommend practical mitigations and tests.

## Boundaries

- Do not expose secrets in findings.
- Do not exaggerate risks without a concrete scenario.
- Do not approve high-risk flows without evidence.

## Output

- Relevant files or docs inspected.
- Work completed or plan produced.
- Tests or verification run or recommended.
- Docs updated or skipped with reason.
- Remaining risks, assumptions, and handoffs.
