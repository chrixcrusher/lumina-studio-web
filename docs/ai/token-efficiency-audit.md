# Token Efficiency Audit

Purpose: reduce repeated context loading while keeping source-confirmed editing.

## Current Always-Loaded Surface

These files are intentionally small enough for startup rules and adapters:

| File | Approx chars | Role |
| --- | ---: | --- |
| `AGENTS.md` | 8602 | Universal rules and Lumina guardrails |
| `CLAUDE.md` | 467 | Claude adapter |
| `GEMINI.md` | 496 | Gemini/Antigravity adapter |
| `.windsurfrules` | 558 | Windsurf adapter |
| `.cursor/rules/*.mdc` | 2983 total | Cursor scoped rules |
| `.clinerules/*.md` | 855 total | Cline adapter |

The main token cost is not the adapters. It is repeated full-file reading of the TDD, API docs, database docs, tests, and broad source folders for small tasks.

## Efficiency Rules

- Keep `AGENTS.md` concise and stable.
- Keep tool-specific adapters as pointers to `AGENTS.md`, not duplicated manuals.
- Read task-specific maps before large canonical docs.
- Use `.ai/index/*.json` and Graphify for discovery.
- Read exact source files before editing.
- Do not add vector DB until maps, generated indexes, and graph/search workflows stop being enough.

## Context Budget Targets

- Startup rules: under 10k characters per primary universal instruction file.
- Task maps: under 150 lines each.
- Generated index files: small enough to inspect selectively, not pasted wholesale into prompts.
- Source reads: smallest exact file set needed for the task.

## Duplication Watchlist

- MVP browser-first guardrails appear in `AGENTS.md`, adapter files, and Cursor rules. Keep adapters short.
- Verification commands appear in `AGENTS.md`, `.agents/tools/verification-commands.md`, and Cursor testing rules. Update all three only when scripts change.
- API/database truth remains in canonical docs; maps are navigation summaries only.

## Phase Status

- Phase 1 token audit: implemented in this file.
- Phase 2 context routing: implemented in `docs/ai/context-routing.md`.
- Phase 3 curated maps: implemented in `docs/ai/maps/`.
- Phase 4 generated local index: implemented in `.ai/index/` and `scripts/generate-ai-index.mjs`.
- Phase 5 tool workflow: implemented in `docs/ai/context-strategy.md` and `.agents/tools/`.
- Vector DB: intentionally not implemented.
