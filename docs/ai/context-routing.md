# Context Routing

Use this routing guide before reading broad docs or source folders.

## Default Flow

1. Read `AGENTS.md`.
2. Pick the smallest relevant map from `docs/ai/maps/`.
3. Inspect generated index files in `.ai/index/` if file discovery is still unclear.
4. Use `rg` or Graphify for exact symbol, route, and dependency discovery.
5. Read exact source files and nearby tests.
6. Edit narrowly, then verify.

## Task Routing

| Task type | Read first | Then inspect |
| --- | --- | --- |
| API route or response change | `docs/ai/maps/api-map.md` | `backend/src/domains/*/*.controller.ts`, service, types, frontend API client, contract tests |
| Backend domain behavior | `docs/ai/maps/backend-map.md` | domain service/controller/module, persistence repository, tests |
| Frontend page or UI behavior | `docs/ai/maps/frontend-map.md` | route page, domain component, service, shared constants, component tests |
| Database schema or query | `docs/ai/maps/database-map.md` | schema, repository, service, database docs, schema/repository tests |
| AI restore or Hugging Face token flow | `docs/ai/maps/api-map.md` and `docs/ai/maps/backend-map.md` | AI domain, Hugging Face integration, account token encryption, frontend enhancement service |
| Tests or failing checks | `docs/ai/maps/testing-map.md` | exact failing test file, subject file, setup/config |
| Deployment/runtime config | `docs/ai/maps/deployment-map.md` | `README.md`, `render.yaml`, env examples, deployment config |
| Multi-agent coordination | `docs/ai/agent-map.md` | `.agents/roles/project-manager.md`, relevant workflow doc |

## Generated Index Routing

- `.ai/index/file-map.json`: find files by area and kind.
- `.ai/index/routes.json`: find backend routes and frontend API call sites.
- `.ai/index/symbols.json`: find exported classes, functions, constants, interfaces, and types.
- `.ai/index/dependency-graph.json`: inspect import relationships before opening files.

Regenerate with:

```powershell
npm run ai:index
```

## Hard Rule

Maps, generated indexes, Graphify, Aider repo maps, and Understand Anything are navigation aids. They are not implementation truth. Always read exact source files before edits.
