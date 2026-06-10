# LuminaStudio Web

LuminaStudio Web is the browser-first MVP for LuminaStudio: a photo editing app where manual image work happens in the frontend and backend services handle identity, presets, metadata-only history, encrypted Hugging Face token storage, and the cloud AI face restoration proxy.

Source of truth: [docs/tdd/ls-web-tdd.md](docs/tdd/ls-web-tdd.md)

## What This App Does

- Runs as a web app in the browser.
- Supports browser-side image editing: upload, filters, crop, rotate, flip, text overlay, and export.
- Stores history metadata only, not image files by default.
- Lets authenticated users save presets and optionally store an encrypted Hugging Face token.
- Lets guests use a Hugging Face token for AI face restoration without storing that token.
- Proxies AI face restoration through `POST /api/v1/ai/restore-face`.

## MVP Boundaries

LuminaStudio Web does not run offline AI models, Real-ESRGAN, local CodeFormer, or server-side manual image enhancement. Manual edits and filters stay in the browser. Desktop and offline AI workflows belong to a future LuminaStudio Desktop design.

Do not add these routes to the Web MVP:

```text
POST /api/v1/enhance/offline
POST /api/v1/enhance/manual
```

## Tech Stack

- Frontend: Next.js, React, Material UI, Vitest, Playwright
- Backend: NestJS, Mongoose, Vitest
- Database: MongoDB
- Package manager: npm workspaces

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- MongoDB running locally, or a MongoDB Atlas/free-tier connection string
- Optional: a Hugging Face token for AI face restoration

## Quick Start For Non-Dev Users

Use this path if you only want to run the app locally and try it.

1. Download or clone the repository.
2. Open a terminal in the project folder.
3. Install dependencies:

```bash
npm install
```

4. Create the frontend local environment file:

PowerShell:

```powershell
Copy-Item frontend\.env.example frontend\.env.local
```

macOS/Linux:

```bash
cp frontend/.env.example frontend/.env.local
```

5. Start MongoDB locally. The default backend connection is:

```text
mongodb://127.0.0.1:27017/lumina-studio-web
```

6. Start the backend in one terminal:

```bash
npm run dev:backend
```

7. Start the frontend in another terminal:

```bash
npm run dev:frontend
```

8. Open the app:

```text
http://localhost:3000
```

The backend runs at:

```text
http://localhost:4000/api/v1
```

You can use browser editing and export without a Hugging Face token. AI face restoration requires a Hugging Face token, either entered as a guest token during the workflow or saved from the authenticated settings screen.

## Developer Setup

Install all workspace dependencies from the repository root:

```bash
npm install
```

Create the frontend local environment file:

```bash
cp frontend/.env.example frontend/.env.local
```

On Windows PowerShell:

```powershell
Copy-Item frontend\.env.example frontend\.env.local
```

The backend reads configuration from process environment variables and has safe local defaults for development. `backend/.env.example` documents the expected variables, but the backend does not automatically load `.env` files. Set backend variables in your shell, terminal profile, or hosting provider when you need to override defaults.

Run the apps in separate terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

Useful local URLs:

```text
Frontend:       http://localhost:3000
Backend root:   http://localhost:4000/api/v1
Backend health: http://localhost:4000/api/v1/health
```

## Scripts

Run these from the repository root.

| Command | Purpose |
| --- | --- |
| `npm run dev:frontend` | Start the Next.js dev server on port `3000`. |
| `npm run dev:backend` | Start the NestJS backend on port `4000`. |
| `npm run build` | Build frontend and backend workspaces. |
| `npm run lint` | Run frontend and backend lint checks. |
| `npm run typecheck` | Run TypeScript checks for both workspaces. |
| `npm run test` | Run frontend and backend unit/component tests. |
| `npm run test:e2e --workspace frontend` | Run Playwright e2e tests for the frontend workspace. |

Workspace-specific commands also work:

```bash
npm run test --workspace frontend
npm run test --workspace backend
npm run build --workspace frontend
npm run build --workspace backend
```

## Production-Like Local Run

Build everything:

```bash
npm run build
```

Start the backend:

```bash
npm run start --workspace backend
```

Start the frontend:

```bash
npm run start --workspace frontend
```

For a real production run, set the required production variables before starting the backend:

```text
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-long-random-jwt-secret
TOKEN_ENCRYPTION_KEY=your-long-random-token-encryption-secret
```

On hosted backend providers such as Render, Railway, or Koyeb, `MONGODB_URI` must be a hosted MongoDB connection string, for example MongoDB Atlas. Do not use `mongodb://127.0.0.1:27017/lumina-studio-web` in deployment; inside a hosted container, `127.0.0.1` means the container itself, not your local machine.

Set `NEXT_PUBLIC_API_BASE_URL` before building the frontend if the API is not served from the same origin.

## Environment Variables

### Frontend

`frontend/.env.local` is used by Next.js during local development.

| Variable | Default/example | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000` | Backend API base URL used by browser requests. |

### Backend

The backend reads these from `process.env`.

| Variable | Local default/example | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | Runtime mode. Production enables stricter required env checks. |
| `PORT` | `4000` | Backend HTTP port. |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed frontend origin for CORS. Comma-separated values are supported. |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/lumina-studio-web` | MongoDB connection string. |
| `JWT_SECRET` | local fallback in development | Secret used to sign auth tokens. Required in production. |
| `TOKEN_ENCRYPTION_KEY` | local fallback in development | Secret used to encrypt saved Hugging Face tokens. Required in production. |
| `MAX_UPLOAD_SIZE_MB` | `10` | JSON/body upload limit for image payloads. |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window for auth and AI restore routes. |
| `RATE_LIMIT_MAX_REQUESTS` | `60` | Max requests per rate limit window. |
| `HUGGING_FACE_CODEFORMER_MODEL` | `sczhou/CodeFormer` | Optional CodeFormer model override. |
| `HUGGING_FACE_INFERENCE_BASE_URL` | Hugging Face inference API | Optional Hugging Face API base URL override. |

Never commit real secrets, JWT secrets, encryption keys, MongoDB credentials, or Hugging Face tokens.

## Project Structure

```text
backend/
  src/
    common/          Shared backend config, rate limiting, logging
    contracts/       API and MVP contract guardrails
    domains/         Auth, account, AI restore, presets, history
    integrations/    Hugging Face client integration
    persistence/     MongoDB schemas and repositories

frontend/
  src/
    app/             Next.js routes
    domains/         Feature UI and client services
    infrastructure/  API client
    shared/          Theme, constants, shared components
    tests/           Component, contract, and e2e tests

docs/                Canonical product, API, data, and execution docs
```

## Verification

Run the standard checks before pushing code:

```bash
npm run lint
npm run typecheck
npm run test
```

Run e2e checks from the frontend workspace when changing upload/editor flows:

```bash
npm run test:e2e --workspace frontend
```

## Troubleshooting

### Frontend Cannot Reach The API

Confirm `frontend/.env.local` contains:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

Restart the frontend dev server after changing this file.

### Backend Cannot Connect To MongoDB

Make sure MongoDB is running locally, or set `MONGODB_URI` to a valid Atlas/free-tier connection string before starting the backend.

If a deployed backend logs `connect ECONNREFUSED 127.0.0.1:27017`, the backend is using the local development MongoDB URI. In the backend hosting provider, set:

```text
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-long-random-jwt-secret
TOKEN_ENCRYPTION_KEY=your-long-random-token-encryption-secret
```

Restart or redeploy the backend after saving the environment variables.

### Production Start Fails With Missing Variables

When `NODE_ENV=production`, the backend requires:

```text
FRONTEND_URL
MONGODB_URI
JWT_SECRET
TOKEN_ENCRYPTION_KEY
```

### AI Restore Fails

AI face restoration requires a valid user-provided Hugging Face token. Guest tokens are never stored. Authenticated saved tokens are encrypted and plain tokens are never returned by the API.

## Deployment Notes

The project is designed to be free-tier-first where possible. Provider-generated URLs are valid for the MVP; paid custom domains are optional. Do not introduce a platform-owned Hugging Face API token by default.
