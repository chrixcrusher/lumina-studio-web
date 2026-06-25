# API Map

Canonical API details live in `wiki/api/ls-web-api_specification.md`.

Global backend prefix: `/api/v1`.

## Auth

| Endpoint | Backend | Frontend | Tests |
| --- | --- | --- | --- |
| `POST /api/v1/auth/register` | `backend/src/domains/auth/auth.controller.ts` -> `auth.service.ts` -> `account.repository.ts` | `frontend/src/domains/authentication/services/auth-api.ts` | `backend/src/domains/auth/auth.controller.spec.ts`, `frontend/src/tests/contracts/api-contract.test.ts` |
| `POST /api/v1/auth/login` | `auth.controller.ts` -> `auth.service.ts` -> `auth-token.service.ts` | `auth-api.ts`, `frontend/src/infrastructure/api/api-client.ts` | auth service/controller specs, frontend auth API specs |
| `POST /api/v1/auth/logout` | `auth.controller.ts` | `auth-api.ts` | auth controller specs |
| `GET /api/v1/auth/me` | `auth.controller.ts` + `jwt-auth.guard.ts` | `auth-api.ts` | auth controller specs |

## Account Token

| Endpoint | Backend | Frontend | Tests |
| --- | --- | --- | --- |
| `PUT /api/v1/account/hugging-face-token` | `backend/src/domains/account/account.controller.ts` -> `account.service.ts` -> `account-token-encryption.service.ts` -> `account.repository.ts` | `frontend/src/domains/account/services/account-api.ts`, `AccountSettingsPage.tsx` | account controller/service/repository specs, frontend account API specs |
| `DELETE /api/v1/account/hugging-face-token` | same account path | same frontend path | same account tests |

Security: guest Hugging Face tokens are never stored. Saved authenticated tokens must be encrypted. Plain tokens must never be returned.

## AI Restore

| Endpoint | Backend | Frontend | Tests |
| --- | --- | --- | --- |
| `POST /api/v1/ai/restore-face` | `backend/src/domains/ai/ai-restore.controller.ts` -> `ai-restore.service.ts` -> `backend/src/integrations/huggingface/*` -> `history.service.ts` | `frontend/src/domains/enhancement/services/restore-face-api.ts`, `EditorWorkspace.tsx` | AI restore specs, Hugging Face integration specs, frontend restore/component/contract tests |

This is the only backend image-processing endpoint in the Web MVP.

Do not add:

```text
POST /api/v1/enhance/offline
POST /api/v1/enhance/manual
```

## Presets

| Endpoint | Backend | Frontend | Tests |
| --- | --- | --- | --- |
| `GET /api/v1/presets` | `backend/src/domains/presets/preset.controller.ts` -> `preset.service.ts` -> `preset.repository.ts` | `frontend/src/domains/presets/services/presets-api.ts` | preset controller/service/repository specs, frontend presets API specs |
| `POST /api/v1/presets` | same preset path | same frontend path | same preset tests |
| `PUT /api/v1/presets/:id` | same preset path | same frontend path | same preset tests |
| `DELETE /api/v1/presets/:id` | same preset path | same frontend path | same preset tests |
| `POST /api/v1/presets/import` | same preset path | same frontend path | same preset tests |
| `GET /api/v1/presets/:id/export` | same preset path | same frontend path | same preset tests |

## History

| Endpoint | Backend | Frontend | Tests |
| --- | --- | --- | --- |
| `GET /api/v1/history` | `backend/src/domains/history/history.controller.ts` -> `history.service.ts` -> `history.repository.ts` | `frontend/src/domains/history/services/history-api.ts`, `HistoryPage.tsx` | history controller/service/repository/schema specs, frontend history API/component tests |
| `POST /api/v1/history` | same history path | same frontend path | same history tests |
| `DELETE /api/v1/history/:id` | same history path | same frontend path | same history tests |

History is metadata-only by default. `originalImageUrl` and `enhancedImageUrl` are nullable future fields.

## Health

| Endpoint | Backend | Frontend | Tests |
| --- | --- | --- | --- |
| `GET /api/v1/health` | `backend/src/app.controller.ts` -> `app.service.ts` | none | app controller/service specs |
