# LuminaStudio Web Development Plan
Version 1.0

Source of truth: `tdd/ls-web-tdd.md`

Related docs:

- `api/ls-web-api_specification.md`
- `database/ls-web-database-schema.md`
- `project-structure/ls-web-project-structure.md`
- `product-specification/ls-web-ps-detailed.md`
- `testing/ls-web-test-specification.md`

---

# 1. Purpose

This document is the agentic coding plan for building LuminaStudio Web.

It breaks the work into medium-sized tickets that are:

- Large enough to be meaningful
- Small enough to complete without token exhaustion
- Written to reduce hallucination and scope drift
- Ordered so each ticket builds on the previous one

The intended workflow is:

```text
Ticket -> Implement -> Test -> Review -> Next Ticket
```

Each ticket should be used as the main instruction source for the AI while coding that slice of work.

---

# 2. Planning Principles

1. The TDD is the canonical product definition.
2. Each ticket must have one primary objective.
3. Tickets should not mix unrelated domains.
4. Tickets should include clear entry and exit criteria.
5. Tickets should define what is explicitly out of scope.
6. Tickets should point to the exact docs the AI must follow.
7. Tickets should finish with verification steps.
8. Tickets should prefer vertical slices where possible.

---

# 3. Ticket Format

Each ticket should follow this template:

```text
Ticket ID:
Title:
Goal:
Related Docs:
Scope:
Out of Scope:
Implementation Notes:
Acceptance Criteria:
Verification:
Dependencies:
```

## 3.1 Ticket Size Guidance

Good ticket size:

- One or two related screens
- One API slice
- One schema or repository slice
- One bounded workflow
- One meaningful integration path

Too small:

- One button color
- One isolated line of copy
- One tiny refactor with no user impact

Too large:

- Entire frontend
- Entire backend
- All authentication plus all AI plus all presets in one ticket
- A ticket that would require a full architecture rewrite

---

# 4. Execution Phases

## Phase 0 - Repository Foundation

Goal:

Set up the project skeleton, shared conventions, and guardrails before feature work begins.

## Phase 1 - Core Identity And Data

Goal:

Build authentication, account token storage, MongoDB schema, and ownership rules.

## Phase 2 - Browser Editor Foundation

Goal:

Build the browser-based image workspace, upload flow, manual editing, filters, and export.

## Phase 3 - Presets And History

Goal:

Add preset CRUD and metadata-only history flows.

## Phase 4 - AI Restore Proxy

Goal:

Implement the Hugging Face AI restore path using user-provided tokens.

## Phase 5 - Hardening And Deployment

Goal:

Add tests, security polish, smoke checks, and deployment setup.

---

# 5. Ticket Backlog

## Phase 0 - Repository Foundation

### Ticket 0.1
Title: Initialize Web app structure

Goal:

Create the frontend and backend project shells, shared scripts, and base configuration needed for implementation.

Related Docs:

- `project-structure/ls-web-project-structure.md`
- `tdd/ls-web-tdd.md`

Scope:

- Frontend app shell
- Backend app shell
- Shared repository scripts
- Environment example files
- Base lint/typecheck/test commands

Out of Scope:

- Business features
- AI integration
- Database business logic

Implementation Notes:

- Follow the project structure doc.
- Keep the initial structure compatible with free-tier deployment.

Acceptance Criteria:

- Frontend and backend can boot locally.
- Base scripts exist for lint, test, and typecheck.
- Folder structure matches the approved architecture.

Verification:

- Start frontend and backend locally.
- Confirm the app shells render or respond.

Dependencies:

- None

---

### Ticket 0.2
Title: Establish shared conventions and guardrails

Goal:

Add the minimum shared documentation and code guardrails that keep future implementation aligned with the TDD.

Related Docs:

- `AGENTS.md`
- `tdd/ls-web-tdd.md`
- `development-plan/ls-web-development-plan.md`

Scope:

- Shared constants and naming rules
- Error handling conventions
- Basic path/module conventions

Out of Scope:

- Feature logic
- UI polish

Acceptance Criteria:

- Canonical names are easy to discover.
- Developers and AI agents have a clear source of truth.

Verification:

- Review docs and shared config for canonical naming consistency.

Dependencies:

- Ticket 0.1

---

## Phase 1 - Core Identity And Data

### Ticket 1.1
Title: Implement account schema and repository layer

Goal:

Create the Account schema, repository, and basic persistence behavior.

Related Docs:

- `tdd/ls-web-tdd.md`
- `database/ls-web-database-schema.md`
- `product-specification/ls-web-ps-detailed.md`

Scope:

- Account schema
- Unique email constraint
- Encrypted Hugging Face token fields
- Token status flag

Out of Scope:

- UI screens
- Preset logic
- History logic

Acceptance Criteria:

- Account records validate correctly.
- Password hash and token fields match the canonical docs.
- Repository methods support create, read, update, and token status operations.

Verification:

- Unit tests for schema and repository methods.

Dependencies:

- Ticket 0.1

---

### Ticket 1.2
Title: Implement authentication endpoints

Goal:

Build register, login, logout, and me endpoints with JWT-based auth.

Related Docs:

- `api/ls-web-api_specification.md`
- `tdd/ls-web-tdd.md`
- `product-specification/ls-web-ps-detailed.md`

Scope:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- Password hashing
- Auth session/token flow

Out of Scope:

- Presets
- History
- AI restore

Acceptance Criteria:

- Users can register and log in.
- Auth-protected account profile endpoint works.
- Logout clears client-side authenticated state.

Verification:

- API tests for success and error cases.

Dependencies:

- Ticket 1.1

---

### Ticket 1.3
Title: Implement Hugging Face token storage

Goal:

Add account token save, delete, and safe status display behavior.

Related Docs:

- `api/ls-web-api_specification.md`
- `tdd/ls-web-tdd.md`
- `database/ls-web-database-schema.md`

Scope:

- `PUT /api/v1/account/hugging-face-token`
- `DELETE /api/v1/account/hugging-face-token`
- Token encryption at rest
- `huggingFaceTokenConfigured` status flag

Out of Scope:

- AI restore execution
- Guest token persistence

Acceptance Criteria:

- Authenticated users can save and remove their token.
- Plain tokens are never returned by the API.
- Frontend can safely display whether a token is configured.

Verification:

- API tests for save/delete/status behavior.

Dependencies:

- Ticket 1.2

---

## Phase 2 - Browser Editor Foundation

### Ticket 2.1
Title: Build workspace shell and upload flow

Goal:

Create the main editor workspace and image upload behavior.

Related Docs:

- `tdd/ls-web-tdd.md`
- `diagrams/ls-web-ufd.md`
- `diagrams/ls-web-flowchart.md`

Scope:

- Landing page entry to workspace
- Guest Enhance Now entry
- Image upload
- File validation
- Canvas/workspace loading state

Out of Scope:

- Manual adjustments
- Filters
- Presets
- AI restore

Acceptance Criteria:

- A user can open the workspace and upload a valid image.
- Invalid files are rejected clearly.

Verification:

- Frontend component tests.
- Basic Playwright upload flow.

Dependencies:

- Ticket 0.1

---

### Ticket 2.2
Title: Implement browser manual editing tools

Goal:

Add browser-side adjustments, crop, rotate, flip, and text overlay.

Related Docs:

- `tdd/ls-web-tdd.md`
- `diagrams/ls-web-ufd.md`
- `diagrams/ls-web-dfd.md`

Scope:

- Brightness, contrast, exposure, saturation
- Highlights and shadows
- Crop
- Rotate
- Flip
- Text overlay
- Preview updates

Out of Scope:

- Backend enhancement endpoints
- Presets
- AI restore

Acceptance Criteria:

- Each tool updates the image preview in the browser.
- No manual edit workflow depends on backend image processing.

Verification:

- Component and browser interaction tests.

Dependencies:

- Ticket 2.1

---

### Ticket 2.3
Title: Implement browser filters and export

Goal:

Add preset-like browser filters and export/download behavior.

Related Docs:

- `tdd/ls-web-tdd.md`
- `diagrams/ls-web-ufd.md`
- `testing/ls-web-test-specification.md`

Scope:

- Vivid
- Black and White
- Vintage
- Warm
- Cool
- Export/download
- Before/after preview support

Out of Scope:

- Saved presets
- AI restore
- Backend image processing

Acceptance Criteria:

- Filters apply in browser.
- Export produces a downloadable image.

Verification:

- Component tests and a browser export flow.

Dependencies:

- Ticket 2.2

---

## Phase 3 - Presets And History

### Ticket 3.1
Title: Implement preset schema and repository

Goal:

Create preset persistence for authenticated users.

Related Docs:

- `database/ls-web-database-schema.md`
- `tdd/ls-web-tdd.md`
- `product-specification/ls-web-ps-detailed.md`

Scope:

- Preset schema
- Unique preset name per account
- Object-based enhancement settings

Out of Scope:

- Preset UI
- History UI
- AI restore

Acceptance Criteria:

- Presets validate and persist correctly.
- Account ownership is enforced.

Verification:

- Schema and repository tests.

Dependencies:

- Ticket 1.1

---

### Ticket 3.2
Title: Implement preset APIs

Goal:

Add preset CRUD, import, and export endpoints.

Related Docs:

- `api/ls-web-api_specification.md`
- `tdd/ls-web-tdd.md`
- `product-specification/ls-web-ps-detailed.md`

Scope:

- `GET /api/v1/presets`
- `POST /api/v1/presets`
- `PUT /api/v1/presets/:id`
- `DELETE /api/v1/presets/:id`
- `POST /api/v1/presets/import`
- `GET /api/v1/presets/:id/export`

Out of Scope:

- Guest preset persistence
- AI restore
- History

Acceptance Criteria:

- Authenticated users can manage their presets.
- Ownership rules are enforced.

Verification:

- API tests for CRUD, import, export, and authorization.

Dependencies:

- Ticket 3.1

---

### Ticket 3.3
Title: Implement history schema and repository

Goal:

Create metadata-only history persistence for authenticated and guest users.

Related Docs:

- `tdd/ls-web-tdd.md`
- `database/ls-web-database-schema.md`
- `testing/ls-web-test-specification.md`

Scope:

- History schema
- `accountId` and `sessionId` ownership rules
- `browser` and `cloud_ai` processing modes
- `restore_face` and browser edit operation types

Out of Scope:

- UI rendering
- AI proxy logic

Acceptance Criteria:

- History records store metadata only.
- Ownership is enforced.

Verification:

- Schema and repository tests.

Dependencies:

- Ticket 1.1

---

### Ticket 3.4
Title: Implement history APIs and UI

Goal:

Add history listing, creation, deletion, and UI presentation.

Related Docs:

- `api/ls-web-api_specification.md`
- `tdd/ls-web-tdd.md`
- `diagrams/ls-web-ufd.md`

Scope:

- `GET /api/v1/history`
- `POST /api/v1/history`
- `DELETE /api/v1/history/:id`
- History section UI
- Metadata display

Out of Scope:

- Full image reload from history
- Permanent image storage

Acceptance Criteria:

- User can view and manage own metadata history.
- History does not promise full image restoration from stored assets.

Verification:

- API tests and browser UI tests.

Dependencies:

- Ticket 3.3

---

## Phase 4 - AI Restore Proxy

### Ticket 4.1
Title: Implement Hugging Face integration layer

Goal:

Create the backend integration wrapper for Hugging Face and CodeFormer.

Related Docs:

- `tdd/ls-web-tdd.md`
- `product-specification/ls-web-ps-detailed.md`
- `api/ls-web-api_specification.md`

Scope:

- Hugging Face client
- CodeFormer provider
- Request/response mapping
- Token handling helpers

Out of Scope:

- UI
- Preset logic
- History UI

Acceptance Criteria:

- Backend can call Hugging Face through a dedicated integration layer.
- Tokens are not exposed outside the service boundary.

Verification:

- Unit tests with mocked Hugging Face responses.

Dependencies:

- Ticket 1.3

---

### Ticket 4.2
Title: Implement AI restore API and workflow

Goal:

Build the canonical web AI restore path using `POST /api/v1/ai/restore-face`.

Related Docs:

- `api/ls-web-api_specification.md`
- `tdd/ls-web-tdd.md`
- `diagrams/ls-web-flowchart.md`
- `testing/ls-web-test-specification.md`

Scope:

- Guest AI restore
- Authenticated AI restore
- Request token mode
- Saved token mode
- History metadata save after success

Out of Scope:

- Offline AI
- Manual enhancement endpoints
- Permanent image storage

Acceptance Criteria:

- Guest and authenticated flows both work.
- Failed restore keeps editor state intact.
- Metadata is saved without storing images by default.

Verification:

- API tests, mocked integration tests, and Playwright user flow tests.

Dependencies:

- Ticket 4.1
- Ticket 3.3

---

## Phase 5 - Hardening And Deployment

### Ticket 5.1
Title: Add frontend and backend test coverage

Goal:

Implement the test suite required to protect the core MVP flows.

Related Docs:

- `testing/ls-web-test-specification.md`
- `tdd/ls-web-tdd.md`

Scope:

- Frontend component tests
- Backend unit and integration tests
- API contract tests
- E2E tests for core workflows

Out of Scope:

- Feature work

Acceptance Criteria:

- Core workflows are covered by automated tests.
- The suite matches the test specification doc.

Verification:

- Run the full test suite.

Dependencies:

- Tickets 1.2 through 4.2

---

### Ticket 5.2
Title: Add security and deployment hardening

Goal:

Prepare the app for free-tier deployment with the right security and operational guardrails.

Related Docs:

- `tdd/ls-web-tdd.md`
- `project-structure/ls-web-project-structure.md`
- `testing/ls-web-test-specification.md`

Scope:

- Environment variables
- CORS
- Rate limiting
- Safe logging
- Deployment smoke checks

Out of Scope:

- New product features

Acceptance Criteria:

- App can be deployed on provider-generated URLs.
- Protected routes remain secure.
- Secrets are not exposed in logs or responses.

Verification:

- Smoke tests in a preview deployment.

Dependencies:

- Tickets 1.2, 1.3, 4.2

---

# 6. Ticket Sequencing Rules

1. Do not start a ticket until its dependencies are complete.
2. Keep each ticket scoped to one primary outcome.
3. If a ticket grows too large, split it into one UI ticket and one API ticket.
4. If a ticket is too small to justify a full review cycle, merge it with the nearest related ticket.
5. Prefer vertical slices that can be tested end to end.
6. Use the linked docs as the instruction set for the AI that executes the ticket.

---

# 7. Recommended Execution Order

The table below is the live status box for the plan.

| Ticket | Title | Status | Notes |
|---|---|---|---|
| 0.1 | Initialize Web app structure | done | Frontend and backend shells, shared scripts, env examples, and boot verification completed. |
| 0.2 | Establish shared conventions and guardrails | done | Canonical constants, agent guardrails, error handling, and path conventions documented for frontend and backend. |
| 1.1 | Implement account schema and repository layer | done | Account schema and repository added; backend unit tests, typecheck, and lint passed. |
| 1.2 | Implement authentication endpoints | done | Register, login, logout, and me JWT flow implemented; backend/frontend auth tests, typecheck, and lint passed. |
| 1.3 | Implement Hugging Face token storage | done | Save/delete token endpoints, encryption at rest, safe status responses, frontend status actions, tests, typecheck, and lint passed. |
| 2.1 | Build workspace shell and upload flow | done | Guest workspace shell, upload validation/loading states, and component coverage completed. |
| 2.2 | Implement browser manual editing tools | done | Browser-side adjustments, crop, rotate, flip, text overlay, preview state, component coverage, and E2E manual-edit flow completed. |
| 2.3 | Implement browser filters and export | done | Browser filters, before/after preview, canvas export/download, component coverage, and E2E export flow completed. |
| 3.1 | Implement preset schema and repository | done | Preset schema, account-scoped repository, ownership tests, typecheck, and lint passed. |
| 3.2 | Implement preset APIs | done | Preset CRUD, import/export endpoints, ownership checks, frontend client alignment, tests, typecheck, and lint passed. |
| 3.3 | Implement history schema and repository | done | History schema, account/session-scoped repository, metadata-only ownership tests, typecheck, and lint passed. |
| 3.4 | Implement history APIs and UI | done | History list/create/delete APIs, metadata-only UI, guest session ownership, API/UI tests, typecheck, and lint passed. |
| 4.1 | Implement Hugging Face integration layer | done | Hugging Face client, CodeFormer provider, token helper, and mocked integration unit tests added. |
| 4.2 | Implement AI restore API and workflow | done | Canonical restore-face API, guest/auth token modes, saved-token use, success history metadata, frontend workflow, API/UI/E2E coverage, typecheck, and tests passed. |
| 5.1 | Add frontend and backend test coverage | done | Added frontend/backend API contract coverage and metadata-only history E2E coverage; unit tests, E2E tests, lint, and typecheck passed. |
| 5.2 | Add security and deployment hardening | done | Env-driven upload limits and frontend origins, CORS hardening, auth/AI rate limiting, safe log redaction, health smoke checks, backend typecheck, tests, and lint passed. |

Status values:

- `pending` = not started
- `in_progress` = currently being worked on
- `done` = completed and verified
- `blocked` = waiting on input or an external dependency

Recommended update rule:

1. Mark a ticket `in_progress` only when work starts.
2. Mark it `done` only after acceptance criteria and verification are complete.
3. Add a short note when a ticket is blocked or partially complete.
4. When an agent finishes a ticket, it should update the status row in this plan before handing the work back.

---

# 8. How To Use This Plan

For each ticket:

1. Read the ticket and only the docs listed in `Related Docs`.
2. Implement the ticket without expanding scope.
3. Run the ticket-specific verification steps.
4. Fix only the issues revealed by that ticket.
5. Move to the next ticket only after acceptance criteria are met.

This keeps the AI focused and reduces hallucination, token usage, and cross-ticket drift.
