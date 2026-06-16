# Context Strategy

Use the smallest reliable context that can answer the task.

- Intent: `docs/tdd/ls-web-tdd.md`, README, and related docs.
- Navigation: Graphify, repo maps, search, and file lists.
- Truth: exact source files and tests.
- Verification: lint, typecheck, tests, build, and e2e where applicable.

Graphify, Aider repo maps, Understand Anything, Repomix, and AI summaries can help locate files. They do not replace reading source.

Default flow:

1. Read `AGENTS.md`.
2. Read relevant docs.
3. Search for exact symbols, routes, constants, and file names.
4. Optionally use Graphify or repo maps to identify related files.
5. Read exact files.
6. Edit narrowly.
7. Verify.

Never edit based only on a graph, summary, embedding result, or generated snapshot.
