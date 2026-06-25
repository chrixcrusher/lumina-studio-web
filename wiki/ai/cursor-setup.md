# Cursor Setup

Cursor rules live in `.cursor/rules/`:

- `00-project.mdc`
- `10-architecture.mdc`
- `20-code-style.mdc`
- `30-testing.mdc`
- `40-ai-workflow.mdc`

These rules point back to `AGENTS.md` and keep Cursor aligned with the same source-confirmed workflow used by Codex and Claude.

When using Cursor chat or agent mode, ask it to read `AGENTS.md` and the relevant skill before editing. Keep generated context as navigation only; exact source files are the final implementation truth.
