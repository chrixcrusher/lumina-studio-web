# Release Workflow

1. Confirm scope, unresolved tickets, and release owner.
2. Run or review the project lint command.
3. Run or review the project typecheck command.
4. Run or review the project test command.
5. Run or review the project build command.
6. Run e2e or smoke checks for critical user, integration, deployment, or automation workflows.
7. Check docs, changelog, env var docs, deployment notes, and operations notes.
8. Confirm no secrets, generated graph outputs, local logs, or unrelated files are staged.
9. Prepare release notes with verification results and known risks.

Deployment to production or destructive database operations require explicit approval.
