# Deployment Map

Canonical deployment details live in `README.md` and `docs/deployment/free-deployment.md`.

## Runtime Shape

- Frontend: Next.js, provider-generated URL supported.
- Backend: NestJS API, provider-generated URL supported.
- Database: MongoDB/MongoDB Atlas free tier where possible.
- AI provider: user-provided Hugging Face token, proxied by backend for AI restore.

## Key Files

- `render.yaml`: Render-oriented backend/frontend service configuration.
- `.env.example`: root environment example.
- `frontend/.env.example`: frontend public API base URL example.
- `backend/.env.example`: backend env examples.
- `backend/src/common/deployment-config.ts`: runtime defaults and env parsing.
- `frontend/src/infrastructure/api/api-client.ts`: frontend API base URL selection.

## Important Environment Variables

- Backend: `MONGODB_URI`, `FRONTEND_ORIGIN`, `JWT_SECRET`, `TOKEN_ENCRYPTION_KEY`, `PORT`, rate limit/body limit variables.
- Frontend: `NEXT_PUBLIC_API_BASE_URL`.
- Optional provider override: `HUGGING_FACE_CODEFORMER_SPACE_URL`.

## Deployment Guardrails

- Prefer free-tier-compatible services.
- Provider-generated URLs are valid for MVP.
- Custom domains are optional and may require payment.
- Do not introduce platform-owned Hugging Face API tokens by default.
- Do not use local MongoDB URI in hosted backend environments.
