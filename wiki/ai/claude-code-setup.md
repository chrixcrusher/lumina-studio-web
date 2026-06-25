# Claude Code Setup

Claude Code should use `CLAUDE.md` as a lightweight adapter and `AGENTS.md` as the shared source of project rules.

Claude-specific subagent adapters live in `.claude/agents/` and mirror the canonical 8 agents:

- `system-architect`
- `product-planning-manager`
- `frontend-ui-ux-developer`
- `backend-database-engineer`
- `devops-engineer`
- `security-engineer`
- `sqa-engineer`
- `technical-documentation-specialist`

Reusable skills live in `.agents/skills/`. Use the same context routing rule as every other assistant: maps and generated indexes are navigation aids, exact source files are truth.
