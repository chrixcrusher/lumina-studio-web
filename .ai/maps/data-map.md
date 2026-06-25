# Data Map

Use this alias map for persistence and data-model work. The full Lumina-specific database map lives in `.ai/maps/database-map.md`.

## Start Here

- MongoDB schemas: `backend/src/persistence/mongodb/schemas`
- Repositories: `backend/src/persistence/repositories`
- Domain services that validate persistence behavior: `backend/src/domains`
- Canonical database docs: `wiki/database/ls-web-database-schema.md`

## Guardrails

- Authenticated records use `accountId`; guest history uses `sessionId`.
- Saved Hugging Face tokens must be encrypted and never returned as plain values.
- History is metadata-only by default.
- Read `.ai/maps/database-map.md`, exact schema/repository files, and tests before editing.
