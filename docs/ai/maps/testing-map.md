# Testing Map

Canonical testing details live in `docs/testing/ls-web-test-specification.md`.

## Commands

- Full lint: `npm run lint`
- Full typecheck: `npm run typecheck`
- Full unit/component/contract tests: `npm run test`
- Full build: `npm run build`
- Frontend e2e: `npm run test:e2e --workspace frontend`
- Full wrapper: `npm run verify`
- AI wrapper: `npm run ai:check`

## Frontend Tests

- `frontend/src/tests/component/mvp-ui.test.tsx`: MVP user flows and UI alignment.
- `frontend/src/tests/contracts/api-contract.test.ts`: frontend API contract calls.
- `frontend/src/tests/e2e/workspace-upload.spec.ts`: Playwright workspace upload/e2e behavior.
- Domain service specs live beside frontend services under `frontend/src/domains/*/services/*.spec.ts`.
- Setup: `frontend/src/tests/setup.ts`, `frontend/vitest.config.ts`, `frontend/playwright.config.ts`.

## Backend Tests

- Domain controller/service specs live under `backend/src/domains/*/*.spec.ts`.
- Persistence schema/repository specs live under `backend/src/persistence/**/*.spec.ts`.
- Integration specs live under `backend/src/integrations/huggingface/*.spec.ts`.
- Common helper specs live under `backend/src/common/*.spec.ts`.
- Contract constants spec: `backend/src/contracts/api-contract.spec.ts`.
- Setup: `backend/vitest.config.ts`.

## Test Selection

- API behavior: backend controller/service tests plus frontend contract/API service tests.
- Schema/repository behavior: schema and repository tests plus affected service tests.
- Editor UI behavior: `mvp-ui.test.tsx`, domain service tests, and Playwright only when workflow risk is high.
- Hugging Face token behavior: account/auth/AI service tests plus safe logger/provider error tests.

Do not claim checks passed unless they actually ran.
