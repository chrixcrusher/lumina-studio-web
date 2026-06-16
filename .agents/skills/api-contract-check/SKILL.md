---
name: api-contract-check
description: Protect API request, response, auth, error, and frontend client compatibility.
---

# API Contract Check

## Check

- Routes/controllers and HTTP methods.
- Request DTOs and validation errors.
- Response shapes and canonical field names.
- Auth requirements and guest/session behavior.
- Frontend API clients and types.
- User-safe error format.
- API docs and contract tests.

## Workflow

1. Read `docs/api/ls-web-api_specification.md`.
2. Read backend controllers/services/DTOs and frontend API clients.
3. Compare tests against documented behavior.
4. Update tests and docs with any intentional contract change.
5. Run relevant frontend and backend tests.

## Lumina Rule

The only backend image-processing endpoint is `POST /api/v1/ai/restore-face`.
