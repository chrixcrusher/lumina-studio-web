---
name: use-context-tools
description: Use Graphify, Aider repo maps, Understand Anything, Repomix, search, and exact file reads efficiently before editing.
---

# Use Context Tools

## Purpose

Find relevant project context with minimum wasted tokens while preserving source-confirmed editing.

## Workflow

1. Read `AGENTS.md` and relevant task docs.
2. Use `rg` or file search for exact names, routes, symbols, and docs.
3. Use Graphify only as a navigation layer to identify related files and module relationships.
4. Use Aider repo maps only as token-efficient coding context inside Aider loops.
5. Use Understand Anything for onboarding or deep project exploration.
6. Use Repomix for portable repo snapshots when sharing context across tools.
7. Read exact source files before edits.
8. Run relevant tests or verification after edits.

## Rules

- Graphify is for navigation, not final truth.
- Repo maps and summaries can be stale.
- Never edit based only on a graph, summary, embedding result, or snapshot.
- Keep generated outputs out of git unless explicitly requested and reviewed.
