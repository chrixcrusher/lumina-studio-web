# Service Map

Use this alias map for backend service work. The full Lumina-specific backend map lives in `.ai/maps/backend-map.md`.

## Start Here

- Bootstrap and module wiring: `backend/src/main.ts`, `backend/src/app.module.ts`
- Domains: `backend/src/domains`
- API contracts/constants: `backend/src/contracts`
- Common helpers: `backend/src/common`
- External integrations: `backend/src/integrations`
- Persistence: `backend/src/persistence`

## Guardrails

- The only backend image-processing endpoint is `POST /api/v1/ai/restore-face`.
- Backend errors must not expose secrets, stack traces, plain Hugging Face tokens, or provider response bodies.
- Read `.ai/maps/backend-map.md`, `.ai/maps/api-map.md`, exact source, and tests before editing.
