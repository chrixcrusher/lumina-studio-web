# LuminaStudio Web Agent Rules

Source of truth: `docs/tdd/ls-web-tdd.md`

Agents working from this repository must keep every implementation and documentation change aligned with the LuminaStudio Web MVP goal:

```text
Build LuminaStudio Web and deploy it free-tier-first where possible.
```

## Canonical Product Boundary

- LuminaStudio Web is browser-first.
- Manual image editing runs in the frontend.
- Filters run in the frontend.
- Crop, rotate, flip, text overlay, and export run in the frontend.
- The backend does not perform server-side manual image enhancement.
- The backend does not run offline AI models.
- The backend does not run Real-ESRGAN or local CodeFormer.
- Desktop and offline AI features belong to a future LuminaStudio Desktop design.

## Canonical Backend Responsibilities

- Authentication.
- Optional encrypted Hugging Face token storage for authenticated users.
- Preset CRUD for authenticated users.
- Metadata-only history for authenticated and guest users.
- AI face restoration proxy through Hugging Face CodeFormer.

The only backend image-processing route in the Web MVP is:

```text
POST /api/v1/ai/restore-face
```

Do not add these routes to the Web MVP:

```text
POST /api/v1/enhance/offline
POST /api/v1/enhance/manual
```

## Storage Rules

- Do not permanently store image files by default.
- History stores metadata only.
- `originalImageUrl` and `enhancedImageUrl` are nullable future fields.
- Guest Hugging Face tokens are never stored.
- Saved authenticated Hugging Face tokens must be encrypted.
- Plain Hugging Face tokens must never be returned by the API.

## Naming Rules

Code guardrails for these canonical values live in:

```text
frontend/src/shared/constants/lumina.ts
backend/src/contracts/lumina.ts
```

Use these exact values:

```text
encryptedHuggingFaceToken
huggingFaceTokenConfigured
browser
cloud_ai
restore_face
text_overlay
```

Allowed history `operationType` values:

```text
adjust
filter
crop
rotate
flip
text_overlay
restore_face
export
```

Allowed history `processingMode` values:

```text
browser
cloud_ai
```

## Error Handling Rules

- API errors should use clear, user-safe messages.
- Frontend API clients should throw a typed API error instead of raw `fetch` responses.
- Backend errors should not expose secrets, plain Hugging Face tokens, stack traces, or provider response bodies.
- Validation errors should name the invalid field and preserve canonical field names from this file.
- Hugging Face failures should be reported as AI restore failures without implying that browser-side editing is unavailable.

## Path And Module Rules

- Frontend app routes live under `frontend/src/app`.
- Frontend feature code lives under `frontend/src/domains/<domain>`.
- Frontend shared UI, theme, constants, and small cross-domain helpers live under `frontend/src/shared`.
- Frontend API infrastructure lives under `frontend/src/infrastructure`.
- Backend feature code lives under `backend/src/domains/<domain>`.
- Backend request/response contracts and canonical enum values live under `backend/src/contracts`.
- Backend reusable framework helpers live under `backend/src/common`.
- Backend external service wrappers live under `backend/src/integrations`.
- Backend persistence code lives under `backend/src/persistence`.

## Deployment Rules

- Prefer free-tier-compatible services.
- The app must work without a paid custom domain by using provider-generated URLs.
- Custom domains are optional and may require payment.
- Do not introduce platform-owned Hugging Face API tokens by default.

## Documentation Rules

- Keep `docs/tdd/ls-web-tdd.md` as the canonical design.
- Update API, database, diagram, flow, and project-structure docs when the TDD changes.
- Avoid adding desktop/offline requirements to Web MVP docs.
- If work is being executed from `docs/development-plan/ls-web-development-plan.md`, update the matching ticket status in that plan when the ticket is resolved.
- Use the plan status values consistently: `pending`, `in_progress`, `done`, `blocked`.
