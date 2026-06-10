# LuminaStudio Web
# Project Structure Detailed Mapping
Version 1.0

Source of truth: `tdd/ls-web-tdd.md`

---

# Purpose

This document maps each LuminaStudio Web MVP API endpoint to its frontend domain, backend controller/service/repository, DTOs, and MongoDB schema.

The Web MVP is browser-first:

- Manual editing runs in the frontend.
- Filters run in the frontend.
- Crop, rotate, flip, text overlay, and export run in the frontend.
- The backend stores metadata only for these browser-side operations.
- The only backend image-processing endpoint is `POST /api/v1/ai/restore-face`.

---

# Authentication Domain

MongoDB schema:

```text
AccountSchema
```

Repository:

```text
account.repository.ts
```

Frontend domain:

```text
frontend/src/domains/authentication/
```

Backend domain:

```text
backend/src/domains/auth/
```

---

## POST `/api/v1/auth/register`

Frontend:

```text
domains/authentication/components/RegisterForm.tsx
domains/authentication/hooks/useRegister.ts
domains/authentication/services/auth.service.ts
```

Backend:

```text
auth.controller.ts
auth.service.ts
account.repository.ts
```

DTOs:

```text
RegisterRequestDto
RegisterResponseDto
```

Schema:

```text
AccountSchema
```

---

## POST `/api/v1/auth/login`

Frontend:

```text
domains/authentication/components/LoginForm.tsx
domains/authentication/hooks/useLogin.ts
domains/authentication/services/auth.service.ts
```

Backend:

```text
auth.controller.ts
auth.service.ts
account.repository.ts
```

DTOs:

```text
LoginRequestDto
LoginResponseDto
```

Schema:

```text
AccountSchema
```

---

## POST `/api/v1/auth/logout`

Frontend:

```text
domains/authentication/hooks/useLogout.ts
domains/authentication/services/auth.service.ts
```

Backend:

```text
auth.controller.ts
auth.service.ts
```

DTO:

```text
LogoutResponseDto
```

---

## GET `/api/v1/auth/me`

Frontend:

```text
domains/authentication/hooks/useCurrentUser.ts
domains/authentication/services/auth.service.ts
```

Backend:

```text
auth.controller.ts
auth.service.ts
account.repository.ts
```

DTO:

```text
CurrentUserResponseDto
```

Schema:

```text
AccountSchema
```

---

# Account Token Domain

MongoDB schema:

```text
AccountSchema
```

Repository:

```text
account.repository.ts
```

Frontend domain:

```text
frontend/src/domains/account/
```

Backend domain:

```text
backend/src/domains/account/
```

---

## PUT `/api/v1/account/hugging-face-token`

Stores or replaces an authenticated user's encrypted Hugging Face token.

Frontend:

```text
domains/account/components/HuggingFaceTokenSettings.tsx
domains/account/hooks/useSaveHuggingFaceToken.ts
domains/account/services/account.service.ts
```

Backend:

```text
account.controller.ts
account.service.ts
account.repository.ts
```

DTOs:

```text
SaveHuggingFaceTokenRequestDto
HuggingFaceTokenStatusResponseDto
```

Schema:

```text
AccountSchema.encryptedHuggingFaceToken
AccountSchema.huggingFaceTokenConfigured
```

---

## DELETE `/api/v1/account/hugging-face-token`

Deletes an authenticated user's saved Hugging Face token.

Frontend:

```text
domains/account/hooks/useDeleteHuggingFaceToken.ts
domains/account/services/account.service.ts
```

Backend:

```text
account.controller.ts
account.service.ts
account.repository.ts
```

DTO:

```text
HuggingFaceTokenStatusResponseDto
```

Schema:

```text
AccountSchema.encryptedHuggingFaceToken
AccountSchema.huggingFaceTokenConfigured
```

---

# AI Restoration Domain

MongoDB schema:

```text
HistorySchema
```

Repositories:

```text
account.repository.ts
history.repository.ts
```

Integration:

```text
huggingface.client.ts
codeformer.provider.ts
```

Frontend domain:

```text
frontend/src/domains/enhancement/
```

Backend domain:

```text
backend/src/domains/ai/
```

---

## POST `/api/v1/ai/restore-face`

Restores faces using Hugging Face CodeFormer and a user-provided Hugging Face token.

Frontend:

```text
domains/enhancement/components/AIRestorePanel.tsx
domains/enhancement/hooks/useRestoreFace.ts
domains/enhancement/services/ai-restore.service.ts
```

Backend:

```text
ai.controller.ts
ai.service.ts
history.repository.ts
account.repository.ts
huggingface.client.ts
codeformer.provider.ts
```

DTOs:

```text
RestoreFaceRequestDto
RestoreFaceResponseDto
```

Schema:

```text
HistorySchema
```

Important boundaries:

- Guest requests must include a temporary Hugging Face token.
- Authenticated requests may include a temporary token or use the saved encrypted token.
- Guest tokens are discarded after the request.
- The backend returns the restored image for immediate use.
- The backend records metadata only.
- The backend does not permanently store image files by default.

---

# Browser Editor Domain

Frontend domain:

```text
frontend/src/domains/editor/
```

Browser-side modules:

```text
domains/editor/adjustments/
domains/editor/filters/
domains/editor/crop/
domains/editor/rotate/
domains/editor/flip/
domains/editor/text-overlay/
domains/editor/export/
```

The browser editor does not have a backend enhancement endpoint. Browser-side operations may call `POST /api/v1/history` only to save metadata.

Not implemented in the Web MVP:

```text
POST /api/v1/enhance/offline
POST /api/v1/enhance/manual
```

---

# History Domain

MongoDB schema:

```text
HistorySchema
```

Repository:

```text
history.repository.ts
```

Frontend domain:

```text
frontend/src/domains/history/
```

Backend domain:

```text
backend/src/domains/history/
```

---

## GET `/api/v1/history`

Frontend:

```text
domains/history/components/HistoryPage.tsx
domains/history/hooks/useHistory.ts
domains/history/services/history.service.ts
```

Backend:

```text
history.controller.ts
history.service.ts
history.repository.ts
```

DTOs:

```text
GetHistoryRequestDto
HistoryListResponseDto
```

---

## POST `/api/v1/history`

Creates a metadata-only history record.

Frontend:

```text
domains/history/hooks/useCreateHistory.ts
domains/history/services/history.service.ts
```

Backend:

```text
history.controller.ts
history.service.ts
history.repository.ts
```

DTOs:

```text
CreateHistoryRequestDto
CreateHistoryResponseDto
```

Schema:

```text
HistorySchema
```

Allowed `processingMode` values:

```text
browser
cloud_ai
```

Allowed `operationType` values:

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

---

## DELETE `/api/v1/history/:id`

Frontend:

```text
domains/history/hooks/useDeleteHistory.ts
domains/history/services/history.service.ts
```

Backend:

```text
history.controller.ts
history.service.ts
history.repository.ts
```

DTOs:

```text
DeleteHistoryRequestDto
DeleteHistoryResponseDto
```

---

# Preset Domain

MongoDB schema:

```text
PresetSchema
```

Repository:

```text
preset.repository.ts
```

Frontend domain:

```text
frontend/src/domains/presets/
```

Backend domain:

```text
backend/src/domains/presets/
```

---

## GET `/api/v1/presets`

Frontend:

```text
domains/presets/hooks/usePresets.ts
domains/presets/services/preset.service.ts
```

Backend:

```text
preset.controller.ts
preset.service.ts
preset.repository.ts
```

DTOs:

```text
GetPresetsRequestDto
PresetListResponseDto
```

---

## POST `/api/v1/presets`

Frontend:

```text
domains/presets/components/PresetManager.tsx
domains/presets/hooks/useCreatePreset.ts
domains/presets/services/preset.service.ts
```

Backend:

```text
preset.controller.ts
preset.service.ts
preset.repository.ts
```

DTOs:

```text
CreatePresetRequestDto
PresetResponseDto
```

---

## PUT `/api/v1/presets/:id`

Frontend:

```text
domains/presets/hooks/useUpdatePreset.ts
domains/presets/services/preset.service.ts
```

Backend:

```text
preset.controller.ts
preset.service.ts
preset.repository.ts
```

DTOs:

```text
UpdatePresetRequestDto
PresetResponseDto
```

---

## DELETE `/api/v1/presets/:id`

Frontend:

```text
domains/presets/hooks/useDeletePreset.ts
domains/presets/services/preset.service.ts
```

Backend:

```text
preset.controller.ts
preset.service.ts
preset.repository.ts
```

DTOs:

```text
DeletePresetRequestDto
DeletePresetResponseDto
```

---

## POST `/api/v1/presets/import`

Frontend:

```text
domains/presets/components/PresetImportDialog.tsx
domains/presets/hooks/useImportPreset.ts
domains/presets/services/preset.service.ts
```

Backend:

```text
preset.controller.ts
preset.service.ts
preset.repository.ts
```

DTOs:

```text
ImportPresetRequestDto
PresetResponseDto
```

---

## GET `/api/v1/presets/:id/export`

Frontend:

```text
domains/presets/hooks/useExportPreset.ts
domains/presets/services/preset.service.ts
```

Backend:

```text
preset.controller.ts
preset.service.ts
preset.repository.ts
```

DTO:

```text
ExportPresetResponseDto
```

---

# MongoDB Schema Ownership

AccountSchema is owned by:

```text
Authentication Domain
Account Token Domain
```

HistorySchema is owned by:

```text
AI Restoration Domain
History Domain
```

PresetSchema is owned by:

```text
Preset Domain
```

---

# Controller Inventory

```text
auth.controller.ts
account.controller.ts
ai.controller.ts
history.controller.ts
preset.controller.ts
```

---

# Repository Inventory

```text
account.repository.ts
history.repository.ts
preset.repository.ts
```

---

# External Integrations

Hugging Face:

```text
huggingface.client.ts
codeformer.provider.ts
```

---

# Implementation Order

Phase 1:

1. Frontend project shell
2. Backend project shell
3. Authentication
4. Account token status
5. Presets

Phase 2:

1. Browser editor
2. Browser export
3. Metadata-only history

Phase 3:

1. Hugging Face integration
2. AI face restoration
3. Guest session support through `x-session-id`

Phase 4:

1. Tests
2. Free-tier deployment setup
3. Monitoring/logging basics

---

# AI Agent Rules

Never bypass:

```text
Controller -> Service -> Repository
```

Never access MongoDB from:

- Controllers
- Frontend

Never call Hugging Face directly from the frontend.

Always use:

```text
Frontend -> Backend API -> Hugging Face
```

Do not implement these routes for the Web MVP:

```text
POST /api/v1/enhance/offline
POST /api/v1/enhance/manual
```

This document is an implementation mapping derived from `tdd/ls-web-tdd.md`.
