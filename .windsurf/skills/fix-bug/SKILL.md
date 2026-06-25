---
name: fix-bug
description: Debug and fix a defect with a minimal source-confirmed change.
---

# Fix Bug

## Workflow

1. Capture expected behavior and actual behavior.
2. Reproduce the issue or inspect failing test/log evidence.
3. Use context routing and search to locate candidate files.
4. Read exact source files and nearby tests.
5. Trace the likely root cause.
6. Make the smallest fix.
7. Add or update a regression test when practical.
8. Run relevant verification.
9. Document root cause, fix, and residual risk.

## Boundaries

- Do not rewrite unrelated code.
- Do not mask the symptom without addressing the root cause.
- Do not claim reproduction or verification unless it happened.

## Output

- Relevant files or docs inspected.
- Work completed or plan produced.
- Tests or verification run or recommended.
- Docs updated or skipped with reason.
- Remaining risks, assumptions, and handoffs.
