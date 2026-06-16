# Context Strategy

Use layers deliberately:

- Docs = intent layer.
- Graphify = navigation layer.
- Aider repo map = coding context layer when using Aider.
- Understand Anything = onboarding/deep understanding layer.
- Repomix = portable snapshot layer.
- Source files = truth layer.
- Tests = verification layer.

Rule: Never edit based only on a graph, summary, embedding result, repo map, or generated snapshot. Always read the exact source file first.

Recommended flow:

1. Start with `AGENTS.md` and the relevant docs.
2. Search with `rg` for exact symbols, routes, and constants.
3. Use optional context tools to find related files.
4. Read exact files and tests.
5. Edit narrowly.
6. Run relevant verification.
