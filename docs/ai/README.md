# AI-Driven Development Setup

This repo uses a portable AI control plane designed for Codex first and compatible with Claude Code, Cursor, Gemini/Antigravity, Cline, Windsurf, and similar agentic assistants.

Start here:

1. Read `AGENTS.md`.
2. Use `docs/ai/context-routing.md` to choose the smallest relevant context.
3. Read the matching compact map in `docs/ai/maps/`.
4. Use `.ai/index/*.json`, `rg`, Graphify, or Understand Anything for discovery.
5. Choose a role from `.agents/roles/` if the task needs a specific perspective.
6. Choose a skill from `.agents/skills/` if the task matches a repeatable workflow.
7. Read exact source files before editing.
8. Run the verification commands documented in `.agents/tools/verification-commands.md`.

LuminaStudio Web remains browser-first. Manual image editing belongs in the frontend; the backend acts as the API, metadata, auth, encrypted token, and Hugging Face CodeFormer proxy layer.

Regenerate lightweight local context indexes with:

```powershell
npm run ai:index
```
