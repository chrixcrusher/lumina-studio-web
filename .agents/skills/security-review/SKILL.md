---
name: security-review
description: Review secrets, auth, authorization, token storage, logging, uploads, external API calls, dependency risk, injection, XSS, and CSRF concerns.
---

# Security Review

## Check

- Secrets and environment variables.
- Authentication and authorization.
- Hugging Face token storage, return values, and logs.
- File upload validation and unsafe file operations.
- External API timeouts, retries, and sanitized errors.
- Dependency and supply-chain risks.
- Injection, XSS, and CSRF where applicable.

## Workflow

1. Read `AGENTS.md` security rules.
2. Inspect exact changed files and sensitive call paths.
3. Search for token/logging/error exposure.
4. Verify tests cover important failure paths.
5. Report findings by severity with file/line references.

## Hard Rules

- Plain Hugging Face tokens must never be returned by the API.
- Guest tokens must not be persisted.
- Provider response bodies and stack traces must not leak to users.
