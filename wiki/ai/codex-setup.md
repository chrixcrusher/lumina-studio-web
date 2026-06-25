# Codex Setup

Codex should use `AGENTS.md` as the primary instruction file.

For repeatable workflows, use `.agents/skills/`. For role-specific reasoning, use `.agents/roles/`. For command and context policies, use `.agents/tools/`.

Expected Codex workflow:

1. Read `AGENTS.md`.
2. Confirm intent from the relevant docs.
3. Search or use context tools to find candidate files.
4. Read exact source files before edits.
5. Implement small changes.
6. Run relevant verification.
7. Summarize files changed, commands run, and risks.

Do not claim verification passed unless the command actually ran.
