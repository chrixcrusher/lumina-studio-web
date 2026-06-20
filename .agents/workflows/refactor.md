# Refactor Workflow

Use this for structure-only or maintainability changes that should preserve behavior.

1. Define the exact behavior that must remain unchanged.
2. Identify affected modules and tests.
3. Read exact files before moving or editing code.
4. Keep changes incremental and reversible.
5. Avoid broad rewrites and unrelated formatting churn.
6. Run tests that prove behavior stayed stable.
7. Update docs only if structure or ownership changed.

Do not use refactors to sneak in backend offline AI, server-side manual enhancement, or paid-service assumptions.
