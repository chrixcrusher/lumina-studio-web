# Backend Map

Canonical backend boundaries live in `AGENTS.md` and `wiki/tdd/ls-web-tdd.md`.

## Entry Points

- `backend/src/main.ts`: Nest bootstrap, body limits, CORS, rate limits, global prefix `/api/v1`.
- `backend/src/app.module.ts`: Mongo connection and domain module wiring.
- `backend/src/app.controller.ts`: root and health endpoints.

## Domains

| Domain | Controller | Service | Types | Persistence/Integration |
| --- | --- | --- | --- | --- |
| Auth | `backend/src/domains/auth/auth.controller.ts` | `auth.service.ts`, `auth-password.service.ts`, `auth-token.service.ts`, `jwt-auth.guard.ts` | `auth.types.ts` | `account.repository.ts` |
| Account | `backend/src/domains/account/account.controller.ts` | `account.service.ts`, `account-token-encryption.service.ts` | `account.types.ts` | `account.repository.ts`, `account.schema.ts` |
| AI Restore | `backend/src/domains/ai/ai-restore.controller.ts` | `ai-restore.service.ts` | `ai-restore.types.ts` | Hugging Face integration, history service |
| Presets | `backend/src/domains/presets/preset.controller.ts` | `preset.service.ts` | `preset.types.ts` | `preset.repository.ts`, `preset.schema.ts` |
| History | `backend/src/domains/history/history.controller.ts` | `history.service.ts` | `history.types.ts` | `history.repository.ts`, `history.schema.ts` |

## Integrations

- `backend/src/integrations/huggingface/hugging-face.client.ts`: provider HTTP/SSE behavior and safe provider error mapping.
- `backend/src/integrations/huggingface/codeformer.provider.ts`: CodeFormer provider details.
- `backend/src/integrations/huggingface/hugging-face-token.service.ts`: token validation helpers.

## Common Helpers

- `backend/src/common/deployment-config.ts`: environment parsing and defaults.
- `backend/src/common/rate-limit.middleware.ts`: in-memory rate limiting.
- `backend/src/common/safe-logger.ts`: logging that avoids sensitive leakage.
- `backend/src/contracts/lumina.ts`: canonical constants shared with frontend equivalents.

## Backend Guardrails

- Controller -> Service -> Repository -> MongoDB.
- AI service -> Hugging Face client -> external API.
- No controller should call MongoDB or external providers directly.
- Do not add backend manual enhancement or offline AI.
- Do not return stack traces, provider bodies, or plain Hugging Face tokens.
