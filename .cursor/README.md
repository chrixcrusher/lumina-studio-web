# Cursor Adapters

Cursor-compatible adapters are generated from canonical files in `.agents/`.

- Rules: `.cursor/rules/*.mdc`
- Skills: `.cursor/skills/<skill>/SKILL.md`

Edit `.agents/roles/` or `.agents/skills/`, then run `scripts/generate-ai-adapters.ps1`. Rules should point back to `AGENTS.md`, `wiki/`, and `.agents/`.
