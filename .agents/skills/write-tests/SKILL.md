---
name: write-tests
description: Add or improve unit, integration, contract, component, or e2e tests.
---

# Write Tests

## Coverage Types

- Unit tests for isolated services, helpers, and validation.
- Integration or contract tests for API behavior and frontend/backend compatibility.
- Component tests for UI states and user interactions.
- E2E tests for critical browser workflows when appropriate.
- Regression tests for confirmed bugs.

## Workflow

1. Read the behavior and existing test patterns.
2. Choose the narrowest test level that gives useful confidence.
3. Cover success, failure, auth/guest behavior, and edge cases.
4. Use clear test names that describe expected behavior.
5. Avoid brittle implementation-detail assertions.
6. Run the affected test command and any required typecheck/lint.

## Useful Commands

- `npm run test --workspace frontend`
- `npm run test --workspace backend`
- `npm run test:e2e --workspace frontend`
- `npm run typecheck`
