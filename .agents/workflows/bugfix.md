# Bugfix Workflow

1. Capture expected behavior and actual behavior.
2. Reproduce the issue or inspect failing tests/log evidence.
3. Use context routing, indexes, or search to locate candidate files.
4. Read exact source files and nearby tests.
5. Trace the root cause.
6. Make the smallest fix through the owning implementation agent.
7. Add a regression test where practical.
8. Run the affected test plus typecheck or lint when relevant.
9. Summarize root cause, fix, verification, and residual risk.

Use `api-contract-check`, `database-change`, or `security-review` when the bug touches those concerns.
