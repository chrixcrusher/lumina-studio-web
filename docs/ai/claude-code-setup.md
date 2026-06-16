# Claude Code Setup

Claude Code should start with `CLAUDE.md`, which points back to `AGENTS.md`.

Claude-specific subagent prompts live in `.claude/agents/`. Portable roles live in `.agents/roles/`, and reusable workflows live in `.agents/skills/`.

Use subagents for focused analysis:

- `system-architect` for plans and boundaries.
- `frontend-engineer` for Next.js and browser behavior.
- `backend-engineer` for NestJS APIs.
- `database-engineer` for Mongoose persistence.
- `sqa-engineer` for test strategy.
- `devops-engineer` for deployment and env config.
- `security-reviewer` for security risk.
- `ai-integration-engineer` for Hugging Face CodeFormer flows.

Subagents should read exact files before giving implementation guidance.
