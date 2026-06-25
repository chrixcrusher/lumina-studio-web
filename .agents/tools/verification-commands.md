# Verification Commands

LuminaStudio Web uses npm workspaces for the frontend and backend.

## Root Commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install workspace dependencies. |
| `npm run dev:frontend` | Start the Next.js frontend development server. |
| `npm run dev:backend` | Start the NestJS backend development server. |
| `npm run lint` | Run frontend and backend lint checks. |
| `npm run typecheck` | Run frontend and backend TypeScript checks. |
| `npm run test` | Run frontend and backend Vitest suites. |
| `npm run build` | Build frontend and backend workspaces. |
| `npm run verify` | Run lint, typecheck, tests, and build. |
| `npm run ai:check` | AI workflow alias for `npm run verify`. |

## Subsystem Commands

| Subsystem | Command | Purpose |
| --- | --- | --- |
| Frontend | `npm run dev --workspace frontend` | Start the frontend workspace dev server. |
| Frontend | `npm run test:e2e --workspace frontend` | Run Playwright e2e tests. |
| Backend | `npm run dev --workspace backend` | Start the backend workspace dev server. |

## AI Context Commands

| Command | Purpose |
| --- | --- |
| `npm run ai:index` | Regenerate `.ai/index` discovery files. |
| `npm run ai:context` | Alias for `npm run ai:index`. |
| `npm run ai:graph` | Build/update the ignored Graphify graph. |

Generated maps, indexes, graphs, repo maps, embeddings, and snapshots are navigation aids only. Read exact source files before edits.

Do not claim any command passed unless it actually ran.
