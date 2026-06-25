# Database Map

Canonical database details live in `wiki/database/ls-web-database-schema.md`.

## MongoDB Schemas

| Collection | Schema | Repository | Domain |
| --- | --- | --- | --- |
| `accounts` | `backend/src/persistence/mongodb/schemas/account.schema.ts` | `backend/src/persistence/repositories/account.repository.ts` | auth, account, AI saved token lookup |
| `presets` | `backend/src/persistence/mongodb/schemas/preset.schema.ts` | `backend/src/persistence/repositories/preset.repository.ts` | presets |
| `histories` | `backend/src/persistence/mongodb/schemas/history.schema.ts` | `backend/src/persistence/repositories/history.repository.ts` | history, AI restore metadata |

## Indexes

- Account: unique `email`.
- Preset: unique `{ accountId, presetName }`, plus `{ accountId, createdAt }`.
- History: `{ accountId, createdAt }`, `{ sessionId, createdAt }`, `operationType`, `processingMode`.

## Ownership Rules

- Authenticated records use `accountId`.
- Guest records use `sessionId`.
- History owner validation requires one owner path, not neither.

## Token Storage Rules

- `encryptedHuggingFaceToken` is optional and must not be selected by default.
- `huggingFaceTokenConfigured` is the public boolean status.
- Guest Hugging Face tokens are never persisted.
- Plain Hugging Face tokens must never be returned by API responses.

## History Rules

- History stores metadata only by default.
- Allowed `operationType`: `adjust`, `filter`, `crop`, `rotate`, `flip`, `text_overlay`, `restore_face`, `export`.
- Allowed `processingMode`: `browser`, `cloud_ai`.
- `originalImageUrl` and `enhancedImageUrl` are nullable future fields.

## Tests To Inspect

- `backend/src/persistence/mongodb/schemas/*.spec.ts`
- `backend/src/persistence/repositories/*.spec.ts`
- domain service specs that validate DTO-to-repository behavior.
