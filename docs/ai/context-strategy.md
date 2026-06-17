# Context Strategy

Use the smallest reliable context that can answer the task.

- Intent: `docs/tdd/ls-web-tdd.md`, README, and related docs.
- Routing: `docs/ai/context-routing.md`.
- Compact maps: `docs/ai/maps/`.
- Generated local index: `.ai/index/*.json`.
- Navigation: Graphify, repo maps, search, and file lists.
- Truth: exact source files and tests.
- Verification: lint, typecheck, tests, build, and e2e where applicable.

Graphify, Aider repo maps, Understand Anything, Repomix, and AI summaries can help locate files. They do not replace reading source.

Default flow:

1. Read `AGENTS.md`.
2. Read `docs/ai/context-routing.md`.
3. Read the smallest relevant file in `docs/ai/maps/`.
4. Inspect `.ai/index/*.json` if discovery is still unclear.
5. Search for exact symbols, routes, constants, and file names.
6. Optionally use Graphify, Understand Anything, or Aider repo maps to identify related files.
7. Read exact files.
8. Edit narrowly.
9. Verify.

Never edit based only on a graph, summary, embedding result, or generated snapshot.

Regenerate lightweight local indexes with `npm run ai:index`. Update maps when routes, schemas, ownership boundaries, or major workflows change.
