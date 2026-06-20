# Frontend Map

Canonical frontend boundaries live in `AGENTS.md` and `docs/tdd/ls-web-tdd.md`.

## App Routes

| Route | Page | Primary Domain Component |
| --- | --- | --- |
| `/` | `frontend/src/app/page.tsx` | `frontend/src/domains/landing/components/LandingPage.tsx` |
| `/editor` | `frontend/src/app/editor/page.tsx` | `frontend/src/domains/editor/components/EditorWorkspace.tsx` |
| `/auth/login` | `frontend/src/app/auth/login/page.tsx` | `frontend/src/domains/authentication/components/AuthForm.tsx` |
| `/auth/register` | `frontend/src/app/auth/register/page.tsx` | `AuthForm.tsx` |
| `/settings` | `frontend/src/app/settings/page.tsx` | `frontend/src/domains/account/components/AccountSettingsPage.tsx` |
| `/presets` | `frontend/src/app/presets/page.tsx` | `frontend/src/domains/presets/components/PresetsPage.tsx` |
| `/history` | `frontend/src/app/history/page.tsx` | `frontend/src/domains/history/components/HistoryPage.tsx` |

## API Client Layer

- `frontend/src/infrastructure/api/api-client.ts`: base URL, auth token storage, typed `ApiError`, JSON request handling.
- `frontend/src/domains/authentication/services/auth-api.ts`: register, login, logout, current user.
- `frontend/src/domains/account/services/account-api.ts`: save/delete Hugging Face token status.
- `frontend/src/domains/enhancement/services/restore-face-api.ts`: AI restore call.
- `frontend/src/domains/history/services/history-api.ts`: metadata-only history.
- `frontend/src/domains/presets/services/presets-api.ts`: preset CRUD/import/export.

## Browser Editing

- `frontend/src/domains/editor/components/EditorWorkspace.tsx`: manual adjustments, filters, crop/rotate/flip, text overlay, export, AI restore UI callout.
- `frontend/src/shared/constants/lumina.ts`: canonical operation and processing mode constants.
- `frontend/src/shared/guest-session.ts`: guest session ID storage.

## Frontend Guardrails

- Manual editing and export stay browser-side.
- Frontend does not call MongoDB or Hugging Face directly.
- API client throws typed `ApiError`, not raw fetch responses.
- Plain Hugging Face tokens should not be displayed after save.
- Read exact component/service/test files before editing.
