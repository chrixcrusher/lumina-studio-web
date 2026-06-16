# LuminaStudio Web Agent Rules

Source of intent: `docs/tdd/ls-web-tdd.md`. Source files remain the final implementation truth.

Agents working in this repository must keep every implementation and documentation change aligned with the LuminaStudio Web MVP goal:

```text
Build LuminaStudio Web and deploy it free-tier-first where possible.
```

## Project Overview

LuminaStudio Web is a browser-first photo editor. Manual editing, filters, crop, rotate, flip, text overlay, and export run in the frontend. The backend handles authentication, optional encrypted Hugging Face token storage, preset CRUD, metadata-only history, and the cloud AI face restoration proxy.

The only backend image-processing route in the Web MVP is:

```text
POST /api/v1/ai/restore-face
```

Do not add these Web MVP routes:

```text
POST /api/v1/enhance/offline
POST /api/v1/enhance/manual
```

## Detected Tech Stack

- Monorepo/package manager: npm workspaces.
- Frontend: Next.js, React, TypeScript, Material UI, Vitest, Playwright.
- Backend: NestJS, TypeScript, Mongoose, MongoDB, Vitest.
- Deployment: free-tier-first, provider-generated URLs allowed, custom domains optional.

## Repository Map

- `frontend/src/app`: Next.js routes.
- `frontend/src/domains/<domain>`: frontend feature code.
- `frontend/src/shared`: shared UI, theme, constants, and small cross-domain helpers.
- `frontend/src/infrastructure`: frontend API infrastructure.
- `backend/src/domains/<domain>`: backend feature modules.
- `backend/src/contracts`: request/response contracts and canonical enum values.
- `backend/src/common`: reusable framework helpers.
- `backend/src/integrations`: external service wrappers.
- `backend/src/persistence`: persistence modules, repositories, and MongoDB schemas.
- `docs/tdd/ls-web-tdd.md`: canonical design.
- `docs/api/ls-web-api_specification.md`: API contract documentation.
- `docs/database/ls-web-database-schema.md`: database schema documentation.
- `docs/diagrams`: ERD, DFD, flowchart, and user-flow diagrams.
- `.agents`: portable AI roles, skills, workflows, and tool policies.
- `docs/ai`: human-facing AI development setup docs.

## Core Operating Rules

- Prefer project docs as the source of product intent.
- Prefer exact source files as the source of implementation truth.
- Use context tools such as Graphify, Aider repo maps, Understand Anything, and Repomix only for discovery or navigation.
- Never edit based only on a graph, summary, embedding result, repo map, or generated snapshot.
- Read exact files before changing them.
- Make small, reviewable edits that follow existing project patterns.
- Run relevant verification before claiming success.
- Ask for approval before destructive, high-risk, production, secret, or migration operations.

## Context Strategy

- Docs are the intent layer.
- Graphify is the navigation layer.
- Aider repo maps are a coding context layer for Aider sessions.
- Understand Anything is an onboarding and deep-inspection layer.
- Repomix is a portable snapshot layer.
- Source files are the truth layer.
- Tests, lint, typecheck, and build are the verification layer.

Use `rg`/file search first, then read exact source files. Keep large generated outputs out of git.

## Code Editing Rules

- Keep manual image editing in the browser.
- Do not add backend offline AI models, Real-ESRGAN, local CodeFormer, or server-side manual enhancement.
- Keep canonical values in sync with `frontend/src/shared/constants/lumina.ts` and `backend/src/contracts/lumina.ts`.
- Use exact canonical values: `encryptedHuggingFaceToken`, `huggingFaceTokenConfigured`, `browser`, `cloud_ai`, `restore_face`, `text_overlay`.
- Allowed history `operationType`: `adjust`, `filter`, `crop`, `rotate`, `flip`, `text_overlay`, `restore_face`, `export`.
- Allowed history `processingMode`: `browser`, `cloud_ai`.
- Frontend API clients should throw typed API errors instead of raw `fetch` responses.
- Backend errors must not expose secrets, plain Hugging Face tokens, stack traces, or provider response bodies.

## Testing Rules

- Add or update tests when behavior changes.
- Prefer focused unit/contract tests for narrow changes and broader integration/e2e checks for cross-module workflows.
- Do not claim a command passed unless it actually ran.
- If verification is skipped, state why.

## Documentation Rules

- Keep `docs/tdd/ls-web-tdd.md` canonical.
- Update API, database, diagram, flow, and project-structure docs when behavior or architecture changes.
- If resolving work from `docs/development-plan/ls-web-development-plan.md`, update the matching ticket status with `pending`, `in_progress`, `done`, or `blocked`.
- Avoid adding desktop/offline requirements to Web MVP docs.

## Security Rules

- Do not commit secrets, JWT secrets, encryption keys, MongoDB credentials, or Hugging Face tokens.
- Guest Hugging Face tokens are never stored.
- Authenticated saved Hugging Face tokens must be encrypted.
- Plain Hugging Face tokens must never be returned by the API or written to logs.
- Validate uploaded file type and size on relevant boundaries.
- Report Hugging Face failures as AI restore failures without implying browser-side editing is unavailable.

## Git And PR Rules

- Check `git status` before major edits.
- Do not revert user changes unless explicitly asked.
- Keep commits scoped and explain verification in PR notes.
- Avoid force push, reset, clean, or destructive history operations without explicit approval.

## Tool Usage Policy

- Safe inspection: `rg`, `Get-Content`, directory listing, `git status`, `git diff`, `git log`.
- Safe verification: npm scripts documented below.
- Approval required: deletes, resets, cleans, force pushes, production deploys, migration execution, global installs, secret/config changes, database destructive operations.
- MCP/connectors may be used only for task-relevant reading, writing, or publishing; never expose secrets or send unnecessary repo content.

## AI Role Usage Guide

Portable role prompts live in `.agents/roles/`.

- Product Manager: requirements, acceptance criteria, user flows, scope.
- System Architect: module impact, boundaries, implementation plan.
- Frontend Engineer: UI, routing, state, API clients, browser behavior.
- Backend Engineer: controllers, services, DTOs, auth guards, contracts.
- Database Engineer: schemas, indexes, data integrity, migrations.
- SQA Engineer: tests, regressions, acceptance verification.
- DevOps Engineer: CI/CD, env vars, deployment, runtime config.
- Security Reviewer: secrets, auth, token handling, logging, dependency risk.
- AI Integration Engineer: Hugging Face integration, user-provided token safety, timeouts, retries.

Claude-specific subagent adapters live in `.claude/agents/`.

## Skill Usage Guide

Reusable workflows live in `.agents/skills/`.

- `use-context-tools`: find files efficiently without treating summaries as truth.
- `implement-feature`: deliver a ticket safely end to end.
- `fix-bug`: reproduce, diagnose, minimally fix, and test a defect.
- `code-review`: review changed code for correctness, architecture, security, contracts, and tests.
- `write-tests`: add focused coverage and regression tests.
- `update-docs`: keep docs aligned with changed behavior.
- `api-contract-check`: protect backend/frontend contract compatibility.
- `database-change`: make schema changes safely.
- `security-review`: review secrets, auth, token, upload, external API, and logging risks.
- `release-check`: prepare a merge or release.

## Verification Commands

- `npm run lint`: frontend and backend lint.
- `npm run typecheck`: frontend and backend TypeScript checks.
- `npm run test`: frontend and backend Vitest suites.
- `npm run build`: frontend and backend builds.
- `npm run test:e2e --workspace frontend`: Playwright e2e tests.
- `npm run verify`: lint, typecheck, test, and build.
- `npm run ai:check`: AI workflow alias for `npm run verify`.

Run the smallest relevant set for the change. For release readiness, run lint, typecheck, tests, and build.

## Forbidden Behaviors

- Do not introduce platform-owned Hugging Face API tokens by default.
- Do not permanently store image files by default.
- Do not add server-side manual enhancement or offline AI to the Web MVP.
- Do not add paid-service requirements for the MVP.
- Do not create fake verification commands or fake pass claims.
- Do not add huge generated graph or snapshot outputs to git.
- Do not overwrite existing docs or rules without preserving useful content.
