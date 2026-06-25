# Pull Request Review Workflow

Review findings first, then summarize.

1. Read `AGENTS.md` and the PR/diff context.
2. Inspect changed files and exact surrounding source.
3. Check correctness, architecture boundaries, security, API/data contracts, type safety, errors, tests, docs, and maintainability.
4. Ask the relevant canonical agent for specialist review when risk crosses ownership boundaries.
5. Verify docs match behavior when API, database, deployment, AI workflow, operations, or user flows change.
6. Report issues ordered by severity with file and line references.
7. State test gaps and residual risk.

Avoid style-only comments unless they hide a real maintenance or correctness issue.
