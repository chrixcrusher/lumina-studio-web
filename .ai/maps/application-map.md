# Application Map

Use this alias map for frontend application work. The full Lumina-specific frontend map lives in `.ai/maps/frontend-map.md`.

## Start Here

- Routes and pages: `frontend/src/app`
- Domain UI and behavior: `frontend/src/domains`
- Shared UI/constants/helpers: `frontend/src/shared`
- API infrastructure: `frontend/src/infrastructure`
- Frontend tests: `frontend/src/tests` and colocated `*.spec.ts`

## Guardrails

- Manual editing, filters, crop, rotate, flip, text overlay, and export stay browser-side.
- Frontend API clients should throw typed `ApiError` values.
- Read `.ai/maps/frontend-map.md`, exact components, services, and tests before editing.
