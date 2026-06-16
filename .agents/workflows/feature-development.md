# Feature Development Workflow

Use this for new user-visible behavior or meaningful API/data changes.

1. Product Manager: clarify the request, user flow, acceptance criteria, and out-of-scope items.
2. System Architect: identify affected modules, contracts, docs, risks, and verification.
3. Relevant Engineer: implement small source-confirmed edits.
4. SQA Engineer: add or update focused tests and acceptance checks.
5. Security Reviewer: review if the change touches auth, tokens, uploads, external APIs, env vars, or persistence.
6. Release Check: run relevant lint, typecheck, tests, build, and doc checks.

Always read exact source files before editing. Keep browser-side manual editing out of the backend.
