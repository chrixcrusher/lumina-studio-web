# Context Strategy

Use layers deliberately:

- Docs = intent layer.
- `docs/ai/context-routing.md` = task routing layer.
- `docs/ai/maps/` = compact orientation layer.
- `.ai/index/*.json` = lightweight generated discovery layer.
- Graphify = navigation layer.
- Aider repo map = coding context layer when using Aider.
- Understand Anything = onboarding/deep understanding layer.
- Repomix = portable snapshot layer.
- Source files = truth layer.
- Tests = verification layer.

Rule: Never edit based only on a graph, summary, embedding result, repo map, or generated snapshot. Always read the exact source file first.

Recommended flow:

1. Start with `AGENTS.md` and the relevant docs.
2. Use `docs/ai/context-routing.md` to choose a route.
3. Read only the matching compact map in `docs/ai/maps/`.
4. Inspect `.ai/index/*.json` or search with `rg` for exact symbols, routes, and constants.
5. Use optional context tools to find related files.
6. Read exact files and tests.
7. Edit narrowly.
8. Run relevant verification.
