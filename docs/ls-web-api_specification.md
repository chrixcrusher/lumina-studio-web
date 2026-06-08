# LuminaStudio Web API Specification
Version: 1.0

Source of truth: `ls-web-tdd.md`

Base URL: `/api/v1`

---

# 1. Introduction

This document defines the REST API contract for the LuminaStudio Web MVP.

The API exists to support:

- Authenticated and guest access
- Account authentication
- Optional encrypted Hugging Face token storage for authenticated users
- AI face restoration through Hugging Face CodeFormer
- Preset management for authenticated users
- Metadata-only operation history

Manual image editing, filters, crop, rotate, flip, text overlay, and export are browser-side workflows. The backend does not process those images.

---

# 2. Architecture Standards

## API Style

REST API.

## Response Format

All JSON endpoints return `application/json`.

AI restoration responses may include base64 image data or a short-lived response payload suitable for immediate frontend preview. The MVP does not persist image files by default.

## Authentication

Authenticated requests use:

```text
Authorization: Bearer <jwt_token>
```

Guest requests use:

```text
x-session-id: <temporary_guest_session_id>
```

## API Versioning

All endpoints are versioned under:

```text
/api/v1
```

---

# 3. Standard Response Models

## Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully"
}
```

## Error Response

```json
{
  "success": false,
  "error": "Bad Request",
  "details": "Missing required field: image"
}
```

---

# 4. Authentication APIs

## POST `/api/v1/auth/register`

Creates a new account.

Request:

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "displayName": "Christian"
}
```

Success `201`:

```json
{
  "success": true,
  "message": "Account registered successfully",
  "account": {
    "id": "account_id",
    "email": "user@example.com",
    "displayName": "Christian",
    "huggingFaceTokenConfigured": false
  },
  "token": "jwt_token"
}
```

Errors:

- `400 Bad Request`
- `409 Conflict`

---

## POST `/api/v1/auth/login`

Authenticates a user.

Request:

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

Success `200`:

```json
{
  "success": true,
  "message": "Authentication successful",
  "token": "jwt_token",
  "account": {
    "id": "account_id",
    "email": "user@example.com",
    "displayName": "Christian",
    "huggingFaceTokenConfigured": true
  }
}
```

Errors:

- `400 Bad Request`
- `401 Unauthorized`

---

## POST `/api/v1/auth/logout`

Terminates the current authenticated session on the client.

Headers:

```text
Authorization: Bearer <jwt_token>
```

Success `200`:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

Errors:

- `401 Unauthorized`

---

## GET `/api/v1/auth/me`

Returns the current authenticated user profile.

Headers:

```text
Authorization: Bearer <jwt_token>
```

Success `200`:

```json
{
  "success": true,
  "account": {
    "id": "account_id",
    "email": "user@example.com",
    "displayName": "Christian",
    "huggingFaceTokenConfigured": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

Errors:

- `401 Unauthorized`

---

# 5. Hugging Face Token APIs

## PUT `/api/v1/account/hugging-face-token`

Stores or replaces the authenticated user's Hugging Face API token.

The token must be encrypted before storage and must never be returned by the API.

Request:

```json
{
  "huggingFaceToken": "hf_xxxxxxxxx"
}
```

Success `200`:

```json
{
  "success": true,
  "message": "Hugging Face token saved",
  "huggingFaceTokenConfigured": true
}
```

Errors:

- `400 Bad Request`
- `401 Unauthorized`

---

## DELETE `/api/v1/account/hugging-face-token`

Deletes the authenticated user's saved Hugging Face API token.

Success `200`:

```json
{
  "success": true,
  "message": "Hugging Face token removed",
  "huggingFaceTokenConfigured": false
}
```

Errors:

- `401 Unauthorized`

---

# 6. AI Restoration API

## POST `/api/v1/ai/restore-face`

Restores faces in an image using Hugging Face CodeFormer.

This is the only backend image-processing endpoint in the Web MVP. It proxies a user-provided Hugging Face token to Hugging Face and returns the restored image to the frontend.

Guest users must provide a Hugging Face token with the request. Authenticated users may provide a token for the current request or use their saved encrypted token.

Request:

```json
{
  "image": "base64_image",
  "huggingFaceToken": "hf_guest_or_temporary_token",
  "useSavedToken": false,
  "settings": {
    "fidelity": 0.7
  },
  "outputFormat": "jpeg"
}
```

Guest headers:

```text
x-session-id: guest_session_id
```

Authenticated headers:

```text
Authorization: Bearer <jwt_token>
```

Success `200`:

```json
{
  "success": true,
  "message": "Face restored successfully",
  "restoredImage": "base64_image",
  "historyId": "history_id",
  "operationType": "restore_face",
  "processingMode": "cloud_ai",
  "settingsUsed": {
    "model": "CodeFormer",
    "fidelity": 0.7
  },
  "outputFormat": "jpeg",
  "processingTimeMs": 4200
}
```

Errors:

- `400 Bad Request`
- `401 Unauthorized`
- `413 Payload Too Large`
- `429 Too Many Requests`
- `502 Bad Gateway`
- `504 Gateway Timeout`

Not included in the Web MVP:

- `POST /api/v1/enhance/offline`
- `POST /api/v1/enhance/manual`
- Server-side Real-ESRGAN
- Server-side manual image enhancement

---

# 7. History APIs

History stores metadata only by default. It does not store image files or reload full image state in the MVP.

Ownership is scoped by:

- `accountId` for authenticated users
- `sessionId` for guest users

## GET `/api/v1/history`

Returns history metadata for the authenticated user or active guest session.

Query parameters:

- `limit`
- `operationType`
- `processingMode`

Success `200`:

```json
{
  "success": true,
  "history": []
}
```

---

## POST `/api/v1/history`

Creates a metadata-only history record.

This endpoint may be called by the frontend after browser-side editing, filters, crop, rotate, flip, text overlay, export, or AI restoration. It does not process images.

Request:

```json
{
  "operationType": "adjust",
  "processingMode": "browser",
  "settingsUsed": {
    "exposure": 10,
    "contrast": 5
  },
  "outputFormat": "jpeg",
  "processingTimeMs": 120,
  "status": "success"
}
```

Success `201`:

```json
{
  "success": true,
  "message": "History metadata saved",
  "historyId": "history_id"
}
```

---

## DELETE `/api/v1/history/:id`

Deletes a history metadata record owned by the current user or guest session.

Responses:

- `200 OK`
- `401 Unauthorized`
- `404 Not Found`

---

# 8. Preset APIs

Preset settings are browser-side adjustment/filter configurations. Presets do not store image files.

## Preset Schema

```json
{
  "presetName": "Warm Vintage",
  "enhancementSettings": {
    "exposure": 5,
    "contrast": -5,
    "saturation": 25,
    "temperature": 8,
    "filter": "vintage"
  }
}
```

## GET `/api/v1/presets`

Returns all presets owned by the authenticated user.

## POST `/api/v1/presets`

Creates a preset for the authenticated user.

## PUT `/api/v1/presets/:id`

Updates an owned preset.

## DELETE `/api/v1/presets/:id`

Deletes an owned preset.

## POST `/api/v1/presets/import`

Validates preset JSON. Authenticated users may save the imported preset; guest users may apply it temporarily in the active browser session.

## GET `/api/v1/presets/:id/export`

Exports an owned preset as JSON.

---

# 9. Database Mapping

Account:

- `_id`
- `email`
- `passwordHash`
- `displayName`
- `encryptedHuggingFaceToken`
- `huggingFaceTokenConfigured`
- `createdAt`
- `updatedAt`

History:

- `_id`
- `accountId`
- `sessionId`
- `originalImageUrl`
- `enhancedImageUrl`
- `operationType`
- `processingMode`
- `settingsUsed`
- `outputFormat`
- `processingTimeMs`
- `status`
- `errorCode`
- `createdAt`

Preset:

- `_id`
- `accountId`
- `presetName`
- `enhancementSettings`
- `createdAt`
- `updatedAt`

---

# 10. Allowed History Values

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

Allowed `processingMode` values:

```text
browser
cloud_ai
```

Allowed `status` values:

```text
success
failed
```

---

# 11. Security Standards

- Password hashing required.
- Saved Hugging Face token encryption required.
- Guest Hugging Face tokens must never be stored.
- Plain Hugging Face tokens must never be returned by the API.
- JWT authentication required for account-owned resources.
- Guest access requires `x-session-id`.
- Rate limiting required for auth and AI endpoints.
- Image validation required for AI restoration.
- Ownership validation required for presets and history.
- Input validation required for all DTOs.
- Uploaded images are not permanently stored by default.

---

# 12. Status Codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 409 | Conflict |
| 413 | Payload Too Large |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 502 | Bad Gateway |
| 504 | Gateway Timeout |

---

# 13. API Summary

- Authentication APIs: 4
- Hugging Face token APIs: 2
- AI restoration APIs: 1
- History APIs: 3
- Preset APIs: 6

Total MVP APIs: 16
