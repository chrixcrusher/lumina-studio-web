---
name: database-change
description: Safely change MongoDB/Mongoose schema, repository, index, or persistence behavior.
---

# Database Change

## Workflow

1. Read `docs/database/ls-web-database-schema.md`.
2. Read relevant schemas, repositories, services, and tests.
3. Define schema/model changes and indexes.
4. Check backward compatibility and query impact.
5. Add migration/backfill notes if existing data is affected.
6. Update database docs and API docs if shapes change.
7. Add or update repository/schema/service tests.
8. Run relevant verification.

## Guardrails

- History stores metadata only by default.
- `originalImageUrl` and `enhancedImageUrl` remain nullable future fields.
- Guest Hugging Face tokens are never stored.
- Saved authenticated Hugging Face tokens must be encrypted.
