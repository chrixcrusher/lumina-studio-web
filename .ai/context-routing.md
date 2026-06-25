# Context Routing

Use this guide before reading broad wiki pages or source folders.

## Default Flow

1. Read `AGENTS.md`.
2. Identify the task type and lead role from `.ai/maps/agent-map.md` or `.ai/maps/agent-map.md` if the project creates one.
3. Pick the smallest relevant map from `.ai/maps/`.
4. Inspect generated index files only if file discovery is still unclear.
5. Use search or approved context tools for exact symbol, route, dependency, and document discovery.
6. Read exact source files, tests, contracts, wiki pages, or configs.
7. Edit narrowly, then verify.

## Task Routing

| Task Type | Read First | Then Inspect |
| --- | --- | --- |
| Frontend page or browser editing behavior | `.ai/maps/frontend-map.md` | Routes, domain components, API clients, shared constants, frontend tests |
| Backend service or API behavior | `.ai/maps/backend-map.md` and `.ai/maps/api-map.md` | Controllers, services, contracts, integrations, backend tests |
| Data model or persistence | `.ai/maps/database-map.md` | Schemas, repositories, service usage, database wiki pages, tests |
| API contract | `.ai/maps/api-map.md` | Contracts, clients, handlers, contract tests |
| Tests or failing checks | `.ai/maps/testing-map.md` | Exact failing test, subject file, setup |
| Deployment or runtime config | `.ai/maps/deployment-map.md` | Deployment wiki pages, config, environment examples |

Compatibility aliases from the reusable template remain available:

- `.ai/maps/application-map.md` -> frontend application work.
- `.ai/maps/service-map.md` -> backend service work.
- `.ai/maps/data-map.md` -> database and persistence work.

## Hard Rule

Maps, generated indexes, graphs, summaries, and embeddings are navigation aids. They are not implementation truth. Always read exact source files before edits.
