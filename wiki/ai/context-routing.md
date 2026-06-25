# Context Routing

Use this routing guide before reading broad docs or source folders.

## Default Flow

1. Read `AGENTS.md`.
2. Identify the task type and lead role from `.ai/maps/agent-map.md`.
3. Pick the smallest relevant map from `.ai/maps/`.
4. Inspect generated index files in `.ai/index/` if file discovery is still unclear.
5. Use `rg`, Graphify, Aider repo maps, or Understand Anything for exact symbol, route, and dependency discovery.
6. Read exact source files, tests, contracts, docs, or configs.
7. Edit narrowly, then verify.

## Task Routing

| Task type | Read first | Then inspect |
| --- | --- | --- |
| API route or response change | `.ai/maps/api-map.md` | Controllers/handlers, services, request/response types, clients, contract tests |
| Backend domain behavior | `.ai/maps/backend-map.md` | Domain service/controller/module, persistence repository, tests |
| Frontend page or UI behavior | `.ai/maps/frontend-map.md` | Route/page, domain component, service, shared constants, component tests |
| Database schema or query | `.ai/maps/database-map.md` | Schema/model, repository/query layer, service usage, database docs, tests |
| AI, external provider, or token flow | `.ai/maps/api-map.md` and relevant integration map | Provider integration, token handling, API/client behavior, security tests |
| Batch, queue, scheduled job, CLI, or automation workflow | Relevant backend/deployment map | Job/worker/script, scheduler config, runtime logs, retry and operations docs |
| Tests or failing checks | `.ai/maps/testing-map.md` | Exact failing test file, subject file, setup/config |
| Deployment/runtime config | `.ai/maps/deployment-map.md` | README, deployment config, env examples, runtime config |
| Multi-agent coordination | `.ai/maps/agent-map.md` | Canonical role file, relevant workflow doc, task status source |
| Documentation update | `.ai/maps/agent-map.md` and relevant project map | Canonical docs, source truth, commands, examples |

## Generated Index Routing

- `.ai/index/file-map.json`: find files by area and kind.
- `.ai/index/routes.json`: find server routes and client API call sites when supported by project config.
- `.ai/index/symbols.json`: find exported classes, functions, constants, interfaces, and types.
- `.ai/index/dependency-graph.json`: inspect import relationships before opening files.
- `.ai/context-config.json`: project-local configuration for index roots, extensions, area labels, and route/client extraction.

Regenerate with:

~~~powershell
npm run ai:index
~~~

## Hard Rule

Maps, generated indexes, Graphify, Aider repo maps, Understand Anything, Repomix, and summaries are navigation aids. They are not implementation truth. Always read exact source files before edits.
