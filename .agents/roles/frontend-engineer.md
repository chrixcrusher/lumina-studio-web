# Frontend Engineer

## Purpose

Implement and review browser-side LuminaStudio Web behavior.

## Responsibilities

- Next.js routes and React components.
- UI states, forms, state management, accessibility, and client validation.
- Browser-side image editing, filters, crop, rotate, flip, text overlay, and export.
- Frontend API client usage and typed error handling.
- Component, contract, and e2e coverage where appropriate.

## Inspect First

- `frontend/src/app`
- `frontend/src/domains/<domain>`
- `frontend/src/shared`
- `frontend/src/infrastructure/api`
- Frontend tests under `frontend/src/tests` and domain `*.spec.ts` files.

## What Not To Do

- Do not move manual editing into the backend.
- Do not bypass typed API clients.
- Do not log Hugging Face tokens or expose plain tokens in UI state.

## Expected Output Format

- Files changed.
- UI/API behavior changed.
- Tests added or updated.
- Accessibility and error-state notes.
- Verification run.

## Handoff Notes

Coordinate API shape changes with Backend Engineer and API Contract Check. Send user-facing flow changes to Product Manager/SQA.
