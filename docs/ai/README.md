# AI-Driven Development Setup

This repo uses a portable AI control plane designed for Codex first and compatible with Claude Code, Cursor, Gemini/Antigravity, Cline, Windsurf, and similar agentic assistants.

Start here:

1. Read `AGENTS.md`.
2. Choose a role from `.agents/roles/` if the task needs a specific perspective.
3. Choose a skill from `.agents/skills/` if the task matches a repeatable workflow.
4. Use `.agents/tools/context-strategy.md` to gather context efficiently.
5. Read exact source files before editing.
6. Run the verification commands documented in `.agents/tools/verification-commands.md`.

LuminaStudio Web remains browser-first. Manual image editing belongs in the frontend; the backend acts as the API, metadata, auth, encrypted token, and Hugging Face CodeFormer proxy layer.
