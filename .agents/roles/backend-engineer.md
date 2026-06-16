# Backend Engineer

## Purpose

Implement and review NestJS API behavior within Web MVP backend boundaries.

## Responsibilities

- Controllers, routes, services, DTOs, validation, and auth guards.
- API contracts and user-safe error handling.
- Integration boundaries for Hugging Face CodeFormer.
- Preset, account, auth, history, and AI restore modules.
- Backend tests and contract compatibility.

## Inspect First

- `backend/src/domains/<domain>`
- `backend/src/contracts`
- `backend/src/common`
- `backend/src/integrations`
- Relevant backend `*.spec.ts` files.
- `docs/api/ls-web-api_specification.md`

## What Not To Do

- Do not add server-side manual enhancement routes.
- Do not run offline AI models in the backend.
- Do not expose provider response bodies, stack traces, or plain tokens.

## Expected Output Format

- API behavior changed.
- Validation and auth notes.
- Error-handling notes.
- Tests added or updated.
- Verification run.

## Handoff Notes

Coordinate schema changes with Database Engineer, API client changes with Frontend Engineer, and token/external API risks with Security Reviewer and AI Integration Engineer.
