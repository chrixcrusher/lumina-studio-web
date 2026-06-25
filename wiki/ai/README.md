# AI-Driven Development Setup

This repo uses a portable AI control plane designed for Codex first and compatible with Claude Code, Cursor, Gemini/Antigravity, Cline, Windsurf, and similar agentic assistants.

For a reusable, stack-agnostic explanation of the full structure, see `wiki/guidelines/ai-structure-guidelines.md`.

Start here:

1. Read `AGENTS.md`.
2. Use `.ai/maps/agent-map.md` to choose one of the 8 canonical agents.
3. Use `.ai/context-routing.md` to choose the smallest relevant context.
4. Read the matching compact map in `.ai/maps/`.
5. Use `.ai/index/*.json`, `rg`, Graphify, Aider repo maps, or Understand Anything for discovery.
6. Choose a skill from `.agents/skills/` if the task matches a repeatable workflow or granular capability.
7. Read exact source files before editing.
8. Run the verification commands documented in `.agents/tools/verification-commands.md`.

Portable roles and skills avoid project source paths. Project-specific context belongs in `AGENTS.md`, `.ai/maps/`, and `.ai/context-config.json` / `.ai/index/`.

Regenerate lightweight local context indexes with:

~~~powershell
npm run ai:index
~~~
