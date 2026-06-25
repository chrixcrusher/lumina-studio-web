# LuminaStudio Web

LuminaStudio Web is a browser-first photo editor MVP. Manual editing, filters, crop, rotate, flip, text overlay, and export run in the frontend. The backend owns authentication, optional encrypted Hugging Face token storage, preset CRUD, metadata-only history, and the cloud AI face restoration proxy.

The MVP goal is:

```text
Build LuminaStudio Web and deploy it free-tier-first where possible.
```

## Tech Stack

- Monorepo: npm workspaces
- Frontend: Next.js, React, TypeScript, Material UI, Vitest, Playwright
- Backend: NestJS, TypeScript, Mongoose, MongoDB, Vitest
- Deployment: free-tier-first, provider-generated URLs allowed

## Project Layout

| Path | Purpose |
| --- | --- |
| `frontend/` | Next.js app, editor UI, browser editing, frontend API clients, frontend tests |
| `backend/` | NestJS API, auth, account token storage, presets, history, AI restore proxy |
| `wiki/` | Human-facing product, technical, API, database, deployment, testing, and AI docs |
| `.ai/` | Project-local context routing, compact maps, and generated discovery indexes |
| `.agents/` | Canonical AI roles, skills, overlays, workflows, and tool policies |
| `scripts/` | AI adapter sync, validation, index generation, and smoke scripts |

## Canonical Docs

- Technical design: `wiki/tdd/ls-web-tdd.md`
- Product specification: `wiki/product-specification/ls-web-ps-detailed.md`
- API contract: `wiki/api/ls-web-api_specification.md`
- Database schema: `wiki/database/ls-web-database-schema.md`
- Deployment: `wiki/deployment/free-deployment.md`
- Testing: `wiki/testing/ls-web-test-specification.md`
- Project structure: `wiki/project-structure/ls-web-project-structure.md`
- AI structure guidelines: `wiki/guidelines/ai-structure-guidelines.md`

## Development

Install dependencies:

```powershell
npm install
```

Run the apps:

```powershell
npm run dev:frontend
npm run dev:backend
```

Run focused checks as needed:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e --workspace frontend
```

Run the full project verification wrapper:

```powershell
npm run verify
```

## AI Workflow

Start with `AGENTS.md`, then use `.ai/context-routing.md` and `.ai/maps/` to choose the smallest useful context. Use `.ai/index/*.json`, `rg`, Graphify, Aider repo maps, or Understand Anything for discovery only; exact source files and wiki pages remain the source of truth.

Canonical AI assets live in `.agents/`. After changing canonical roles, skills, overlays, workflows, or tool policies, regenerate adapters:

```powershell
pwsh scripts/sync-ai-adapters.ps1 -Target all
pwsh scripts/validate-ai-template.ps1
```

Regenerate project-local discovery indexes with:

```powershell
npm run ai:index
```

## MVP Guardrails

- Keep manual image editing in the browser.
- The only backend image-processing endpoint is `POST /api/v1/ai/restore-face`.
- Do not add backend offline enhancement or server-side manual enhancement routes.
- Guest Hugging Face tokens are never stored.
- Authenticated saved Hugging Face tokens must be encrypted.
- Do not commit secrets, local databases, build outputs, runtime logs, or generated graph snapshots.
