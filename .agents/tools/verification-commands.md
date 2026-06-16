# Verification Commands

Detected package manager: npm workspaces.

## Root Commands

- `npm run dev:frontend`: start the Next.js dev server.
- `npm run dev:backend`: build and start the NestJS backend.
- `npm run build`: build frontend and backend workspaces.
- `npm run lint`: run frontend and backend lint checks.
- `npm run typecheck`: run TypeScript checks for both workspaces.
- `npm run test`: run frontend and backend Vitest suites.
- `npm run verify`: run lint, typecheck, test, and build.
- `npm run ai:check`: alias for `npm run verify`.

## Frontend Workspace

- `npm run dev --workspace frontend`
- `npm run build --workspace frontend`
- `npm run lint --workspace frontend`
- `npm run typecheck --workspace frontend`
- `npm run test --workspace frontend`
- `npm run test:e2e --workspace frontend`

## Backend Workspace

- `npm run dev --workspace backend`
- `npm run build --workspace backend`
- `npm run lint --workspace backend`
- `npm run typecheck --workspace backend`
- `npm run test --workspace backend`

Graphify, Understand Anything, Aider, and Repomix are optional. Do not add failing required commands for them unless the tools become project dependencies.
