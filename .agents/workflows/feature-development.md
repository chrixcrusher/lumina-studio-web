# Feature Development Workflow

Use this for new user-visible behavior or meaningful API, data, workflow, or operations changes.

1. Product & Planning Manager: clarify the request, user flow, acceptance criteria, owners, dependencies, and status.
2. System Architect: identify affected modules, contracts, docs, risks, and verification.
3. Relevant implementation agent: Frontend UI/UX Developer, Backend & Database Engineer, or DevOps Engineer implements small source-confirmed edits.
4. SQA Engineer: add or update focused tests and acceptance checks.
5. Security Engineer: review if the change touches auth, tokens, uploads, external APIs, env vars, persistence, automation, or device-facing flows.
6. Technical Documentation Specialist: update README, API, operations, workflow, or integration docs when behavior changes.
7. Release Check: run relevant lint, typecheck, tests, build, and doc checks.

Always route through compact maps and indexes first, then read exact source files before editing.
