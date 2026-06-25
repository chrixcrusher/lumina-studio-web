# LuminaStudio Web Test Specification
Version 1.0

Source of truth: `tdd/ls-web-tdd.md`

---

# 1. Purpose

This document defines the test strategy and test coverage for the LuminaStudio Web MVP.

The goal is to verify that LuminaStudio Web can be built and deployed free-tier-first while preserving the canonical product boundary:

- Browser-side manual editing
- Browser-side filters and export
- Backend authentication
- Optional encrypted Hugging Face token storage
- Hugging Face CodeFormer AI restore proxy
- Preset management
- Metadata-only history
- No permanent image storage by default
- No server-side manual image enhancement
- No offline AI processing in the Web MVP

---

# 2. Test Levels

## 2.1 Unit Tests

Unit tests verify isolated functions, components, services, validators, DTOs, repositories, and domain helpers.

Primary tools:

```text
Frontend: Vitest or Jest, React Testing Library
Backend: Jest
```

## 2.2 Integration Tests

Integration tests verify collaboration between modules, API handlers, services, repositories, MongoDB test database, and mocked external integrations.

Primary tools:

```text
Backend: Jest, Supertest, MongoDB memory server or test MongoDB database
Frontend: React Testing Library with mocked API clients
```

## 2.3 End-to-End Tests

End-to-end tests verify complete user workflows in the browser.

Primary tools:

```text
Playwright
```

## 2.4 Contract Tests

Contract tests verify that frontend API clients and backend responses match `api/ls-web-api_specification.md`.

Primary tools:

```text
TypeScript shared types, OpenAPI or generated API contract tests if added later
```

## 2.5 Deployment Smoke Tests

Deployment smoke tests verify that free-tier deployments boot successfully and can serve core routes.

Primary tools:

```text
Playwright
HTTP health checks
Provider logs
```

---

# 3. Test Environments

## 3.1 Local Development

Used for fast unit, integration, and component tests.

Required local services:

```text
Frontend dev server
Backend dev server
MongoDB local instance or MongoDB memory server
Mock Hugging Face service
```

## 3.2 CI Environment

Used for pull request validation.

Required checks:

```text
Frontend lint
Frontend typecheck
Frontend unit tests
Backend lint
Backend typecheck
Backend unit tests
Backend integration tests
API contract tests
```

## 3.3 Preview Deployment

Used for browser E2E and smoke tests.

Expected deployment shape:

```text
Frontend: Vercel or Cloudflare Pages preview URL
Backend: Render, Koyeb, Railway, or equivalent preview URL
Database: MongoDB Atlas test database where possible
```

The app must work without a paid custom domain by using provider-generated URLs.

---

# 4. Test Data Rules

- Use synthetic test users only.
- Use small fixture images only.
- Do not commit real Hugging Face tokens.
- Do not rely on a platform-owned Hugging Face API token.
- Mock Hugging Face in automated tests by default.
- Use real Hugging Face requests only for manual verification or explicitly approved smoke tests.
- Do not persist uploaded image files in tests unless testing a future storage feature.

Recommended fixture image set:

```text
valid-face-small.jpg
valid-non-face-small.jpg
valid-transparent.png
invalid-text-file.txt
oversized-image.jpg
corrupt-image.jpg
```

---

# 5. Frontend Test Specification

## 5.1 Landing and Navigation

Test cases:

- Landing page renders primary LuminaStudio Web entry points.
- User can navigate to login.
- User can navigate to registration.
- User can enter guest workspace through Enhance Now.
- Guest session ID is created or retrieved when entering guest mode.
- Authenticated-only links are hidden or disabled for guests.

## 5.2 Authentication UI

Test cases:

- Registration form validates required fields.
- Registration form validates email format.
- Registration form validates password length and strength rules.
- Successful registration stores auth state and routes to workspace.
- Login form validates required fields.
- Failed login displays an error without clearing unrelated UI state.
- Successful login stores auth state and routes to workspace.
- Logout clears auth state and returns user to landing page.
- `GET /api/v1/auth/me` failure clears invalid session state.

## 5.3 Guest Mode

Test cases:

- Guest user can open the workspace without registration.
- Guest user receives or reuses a temporary `sessionId`.
- Guest user can upload, edit, filter, and export images.
- Guest user cannot permanently save presets.
- Guest user can import preset JSON for temporary use.
- Guest user must provide a Hugging Face token for AI restore.

## 5.4 Image Upload

Test cases:

- Valid JPEG uploads successfully.
- Valid PNG uploads successfully.
- Unsupported file type shows an upload error.
- Oversized image shows an upload error or is resized before AI restore.
- Corrupt image shows an upload error.
- Upload does not call the backend for browser-only editing.
- Uploaded image loads into canvas or WebGL workspace.

## 5.5 Browser Manual Editing

Test cases:

- Brightness adjustment updates preview.
- Contrast adjustment updates preview.
- Exposure adjustment updates preview.
- Saturation adjustment updates preview.
- Highlights adjustment updates preview.
- Shadows adjustment updates preview.
- Crop updates preview.
- Rotate updates preview.
- Flip updates preview.
- Text overlay renders into the editor preview.
- Before/after toggle compares original upload and current image state.
- Manual edits do not call an enhancement backend endpoint.
- Manual edits may call `POST /api/v1/history` for metadata only.

## 5.6 Browser Filters

Test cases:

- Vivid filter updates preview.
- Black and White filter updates preview.
- Vintage filter updates preview.
- Warm filter updates preview.
- Cool filter updates preview.
- Filter application does not call an enhancement backend endpoint.
- Filter application may call `POST /api/v1/history` with `processingMode: browser`.

## 5.7 AI Restore UI

Test cases:

- AI Restore button is disabled when no image is loaded.
- Guest user sees Hugging Face token input.
- Guest user cannot submit AI restore without a token.
- Authenticated user can choose request token or saved token.
- Authenticated user sees saved token status through `huggingFaceTokenConfigured`.
- Plain saved token value is never displayed.
- AI restore calls `POST /api/v1/ai/restore-face`.
- AI restore success displays restored image.
- AI restore failure keeps current image state.
- Loading state appears during AI restore.
- Hugging Face quota, timeout, invalid token, and no-face errors display clear messages.

## 5.8 Preset Manager

Test cases:

- Authenticated user can create a preset.
- Authenticated user can list presets.
- Authenticated user can apply a preset.
- Authenticated user can update a preset.
- Authenticated user can delete a preset.
- Authenticated user can import preset JSON.
- Authenticated user can export preset JSON.
- Guest user can import preset JSON temporarily.
- Guest user cannot persist presets to MongoDB.
- Invalid preset JSON shows an error.

## 5.9 History UI

Test cases:

- Authenticated user can view own history metadata.
- Guest user can view active-session history metadata.
- History item shows operation type, processing mode, status, and timestamp.
- History does not promise full image reload in the MVP.
- Deleting a history item removes it from the list.
- User cannot see another account's history.

## 5.10 Export

Test cases:

- Export downloads the current image.
- Export includes active manual edits.
- Export includes active filters.
- Export includes text overlay.
- Export can save metadata through `POST /api/v1/history`.
- Export does not require backend image processing.

---

# 6. Backend Test Specification

## 6.1 Authentication APIs

Endpoints:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET /api/v1/auth/me
```

Test cases:

- Register creates account with hashed password.
- Register rejects duplicate email.
- Register rejects invalid email.
- Register rejects weak password.
- Register response never includes `passwordHash`.
- Login returns JWT for valid credentials.
- Login rejects invalid credentials.
- Login response includes `huggingFaceTokenConfigured`.
- Logout returns success for authenticated user.
- Me returns current account for valid JWT.
- Me rejects missing, malformed, or expired JWT.

## 6.2 Hugging Face Token APIs

Endpoints:

```text
PUT /api/v1/account/hugging-face-token
DELETE /api/v1/account/hugging-face-token
```

Test cases:

- Save token requires authentication.
- Save token validates required token value.
- Save token stores `encryptedHuggingFaceToken`, not plain token.
- Save token sets `huggingFaceTokenConfigured: true`.
- Save token response never includes plain token.
- Delete token requires authentication.
- Delete token removes encrypted token.
- Delete token sets `huggingFaceTokenConfigured: false`.

## 6.3 AI Restore API

Endpoint:

```text
POST /api/v1/ai/restore-face
```

Test cases:

- Rejects request without image.
- Rejects unsupported file type.
- Rejects oversized image.
- Guest request requires `x-session-id`.
- Guest request requires `huggingFaceToken`.
- Guest token is not stored.
- Authenticated request may use request token.
- Authenticated request may use saved encrypted token.
- Authenticated request fails clearly when no usable token exists.
- Saved token is decrypted only for the active request.
- Backend forwards image to Hugging Face through `huggingface.client.ts`.
- Hugging Face success returns restored image to frontend.
- Hugging Face failure returns clear API error.
- Timeout returns `504`.
- Upstream failure returns `502`.
- Rate-limited request returns `429`.
- Success creates history metadata with `operationType: restore_face`.
- Success creates history metadata with `processingMode: cloud_ai`.
- Response does not include plain Hugging Face token.
- Response does not include permanent image URLs by default.

## 6.4 History APIs

Endpoints:

```text
GET /api/v1/history
POST /api/v1/history
DELETE /api/v1/history/:id
```

Test cases:

- Create history accepts authenticated `accountId` ownership.
- Create history accepts guest `sessionId` ownership.
- Create history rejects request without account or session.
- Create history validates `operationType`.
- Create history validates `processingMode`.
- Create history accepts `settingsUsed` as object.
- Create history stores metadata only.
- Create history does not require image URLs.
- Get history returns only current account records.
- Get history returns only current guest session records.
- Delete history removes only owned records.
- Delete history rejects another user's record.

## 6.5 Preset APIs

Endpoints:

```text
GET /api/v1/presets
POST /api/v1/presets
PUT /api/v1/presets/:id
DELETE /api/v1/presets/:id
POST /api/v1/presets/import
GET /api/v1/presets/:id/export
```

Test cases:

- Preset endpoints require authentication for persistence.
- Create preset stores `enhancementSettings` as object.
- Create preset rejects missing name.
- Create preset rejects invalid settings.
- List presets returns only current account presets.
- Update preset validates ownership.
- Delete preset validates ownership.
- Import preset validates JSON shape.
- Export preset returns owned preset JSON.
- Guest preset persistence is rejected.

## 6.6 Security and Middleware

Test cases:

- JWT guard protects authenticated routes.
- Guest session middleware reads `x-session-id`.
- DTO validation rejects unknown or invalid fields where appropriate.
- CORS allows configured frontend origin.
- Rate limiting protects auth and AI restore routes.
- Logs do not include plain Hugging Face tokens.
- Errors do not leak stack traces in production.

---

# 7. Database Test Specification

## 7.1 Account Schema

Test cases:

- `email` is unique.
- `passwordHash` is required.
- `displayName` is required.
- `encryptedHuggingFaceToken` is optional.
- `huggingFaceTokenConfigured` is required.
- Plain Hugging Face token is never persisted.

## 7.2 History Schema

Test cases:

- At least one of `accountId` or `sessionId` is present.
- `operationType` enum allows only approved values.
- `processingMode` enum allows only `browser` and `cloud_ai`.
- `settingsUsed` accepts object values.
- `originalImageUrl` and `enhancedImageUrl` are optional.
- `status` allows only `success` and `failed`.
- Indexes support `accountId + createdAt`.
- Indexes support `sessionId + createdAt`.

## 7.3 Preset Schema

Test cases:

- `accountId` is required.
- `presetName` is required.
- `enhancementSettings` is required and stored as object.
- Preset names are unique per account.
- Same preset name can exist across different accounts.

---

# 8. End-to-End User Flows

## 8.1 Guest Browser Editing Flow

Steps:

1. Open landing page.
2. Click Enhance Now.
3. Upload valid image.
4. Apply brightness, crop, and filter.
5. Export image.

Expected result:

- User completes the flow without login.
- No backend enhancement endpoint is called.
- Export downloads a file.

## 8.2 Guest AI Restore Flow

Steps:

1. Open workspace as guest.
2. Upload valid face image.
3. Enter temporary Hugging Face token.
4. Submit AI Restore.

Expected result:

- Frontend calls `POST /api/v1/ai/restore-face`.
- Restored image appears when mocked Hugging Face succeeds.
- Guest token is not persisted.
- History metadata is created with `sessionId`.

## 8.3 Authenticated Preset Flow

Steps:

1. Register account.
2. Upload image.
3. Apply manual adjustments.
4. Save preset.
5. Reload workspace.
6. Apply saved preset.

Expected result:

- Preset is persisted for the authenticated account.
- Preset is not visible to another account.

## 8.4 Authenticated Saved Token Flow

Steps:

1. Log in.
2. Save Hugging Face token.
3. Confirm saved token status.
4. Run AI Restore using saved token.
5. Delete saved token.

Expected result:

- Token value is never displayed.
- Token is encrypted at rest.
- AI restore succeeds with mocked Hugging Face.
- Token status becomes false after deletion.

## 8.5 Metadata-Only History Flow

Steps:

1. Log in.
2. Upload image.
3. Apply filter.
4. Save history metadata.
5. Open history.

Expected result:

- History displays operation metadata.
- History does not reload full image state.
- No permanent image URL is required.

---

# 9. Negative Test Cases

- Invalid JWT cannot access account data.
- User cannot read another user's presets.
- User cannot delete another user's history.
- Guest cannot save persistent presets.
- Guest cannot use AI restore without token.
- Authenticated user cannot use saved-token mode when no token is saved.
- Backend rejects malformed image payload.
- Backend rejects oversized image payload.
- Backend handles Hugging Face timeout gracefully.
- Backend handles Hugging Face invalid-token response gracefully.
- Frontend keeps current image state after AI restore failure.
- Plain Hugging Face token never appears in response body, logs, or UI.

---

# 10. Non-Functional Test Coverage

## 10.1 Performance

Test cases:

- Manual editing response feels immediate for small and medium images.
- Frontend resizes or rejects oversized images before AI restore.
- Backend rejects oversized AI restore payloads.
- AI restore displays loading state within one second.
- Export completes successfully for supported image sizes.

## 10.2 Reliability

Test cases:

- Manual editing works when backend is unavailable.
- Filters work when backend is unavailable.
- Export works when backend is unavailable.
- AI restore failure does not clear current editor state.
- Failed history save does not block image editing or export.

## 10.3 Security

Test cases:

- Passwords are hashed.
- Saved tokens are encrypted.
- Guest tokens are not stored.
- Tokens are not logged.
- Unauthorized requests are rejected.
- Ownership is enforced for presets and history.

## 10.4 Cost Control

Test cases:

- No platform-owned `HUGGING_FACE_API_KEY` is required.
- Manual editing does not call backend image-processing endpoints.
- History does not require permanent image storage.
- App can run with provider-generated deployment URLs.

---

# 11. Deployment Smoke Tests

## 11.1 Frontend Smoke Tests

Checks:

- Landing page returns `200`.
- Workspace route loads.
- Static assets load.
- Environment variable for backend API URL is configured.
- Guest mode can open editor.

## 11.2 Backend Smoke Tests

Checks:

- Backend health endpoint returns `200` if implemented.
- Auth register/login works against test database.
- Protected route rejects unauthenticated request.
- MongoDB connection succeeds.
- AI restore endpoint rejects missing image with `400`.

## 11.3 Cross-Origin Smoke Tests

Checks:

- Frontend can call backend from deployment URL.
- CORS allows configured frontend origin.
- Cookies or authorization headers behave as expected.

---

# 12. Coverage Expectations

Minimum MVP expectations:

```text
Frontend unit/component coverage: core forms, editor controls, AI restore UI, preset UI, history UI
Backend unit coverage: services, validators, token encryption helpers
Backend integration coverage: all API endpoints
E2E coverage: guest edit/export, guest AI restore, auth preset flow, metadata-only history
```

High-risk areas that require tests before release:

- Hugging Face token handling
- AI restore failure behavior
- History ownership
- Preset ownership
- File validation
- No permanent image storage by default
- No server-side manual image enhancement

---

# 13. Out Of Scope For Web MVP Tests

Do not write Web MVP tests for:

- Server-side Real-ESRGAN
- Server-side manual image enhancement
- Offline AI processing
- Electron desktop workflows
- Native file-system integration
- Batch image processing
- Permanent image asset storage
- Public preset sharing
- Paid SaaS subscription flows

These belong to future product documents if those features are added.
