# Release Workflow

1. Confirm scope and unresolved tickets.
2. Run or review `npm run lint`.
3. Run or review `npm run typecheck`.
4. Run or review `npm run test`.
5. Run or review `npm run build`.
6. Run `npm run test:e2e --workspace frontend` for critical browser workflow releases.
7. Check docs, env var docs, and deployment notes.
8. Confirm no secrets, generated graph outputs, or local logs are staged.
9. Prepare release notes with verification results and known risks.

Deployment to production or destructive database operations require explicit approval.
