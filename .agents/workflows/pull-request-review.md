# Pull Request Review Workflow

Review findings first, then summarize.

1. Read `AGENTS.md` and the PR/diff context.
2. Inspect changed files and exact surrounding source.
3. Check correctness, architecture boundaries, security, API contracts, type safety, errors, tests, and maintainability.
4. Verify docs match behavior when API, database, deployment, or user flows change.
5. Report issues ordered by severity with file/line references.
6. State test gaps and residual risk.

Avoid style-only comments unless they hide a real maintenance or correctness issue.
