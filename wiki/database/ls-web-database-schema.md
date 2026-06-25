# Database Schema

## Database Technology

LuminaStudio Web uses MongoDB as its primary database. The database stores account data, preset configurations, and operation history metadata.

The system does not permanently store image files by default in the MVP. Image URL fields are optional and reserved for future object storage integration.

---

# 1. Account

Stores authenticated user information and optional encrypted Hugging Face token data.

## Collection

```txt
accounts
```

## Schema

| Field                        | Type     | Required | Description                                    |
| ---------------------------- | -------- | -------: | ---------------------------------------------- |
| `_id`                        | ObjectId |      Yes | Unique account identifier                      |
| `email`                      | String   |      Yes | Unique user email address                      |
| `passwordHash`               | String   |      Yes | Hashed password                                |
| `displayName`                | String   |      Yes | User display name                              |
| `encryptedHuggingFaceToken`  | String   |       No | Encrypted user-provided Hugging Face API token |
| `huggingFaceTokenConfigured` | Boolean  |      Yes | Indicates whether the user has a saved token   |
| `createdAt`                  | Date     |      Yes | Account creation timestamp                     |
| `updatedAt`                  | Date     |      Yes | Last account update timestamp                  |

## Example Document

```json
{
  "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "email": "user@example.com",
  "passwordHash": "$2b$10$hashedPasswordValue",
  "displayName": "Christian",
  "encryptedHuggingFaceToken": "encrypted_token_value",
  "huggingFaceTokenConfigured": true,
  "createdAt": "2026-06-06T08:00:00.000Z",
  "updatedAt": "2026-06-06T08:00:00.000Z"
}
```

## Notes

* Guest users do not create Account records.
* Hugging Face tokens are always user-provided.
* Guest tokens must never be stored.
* Authenticated users may optionally save a Hugging Face token.
* Saved tokens must be encrypted before storage.
* Plain Hugging Face tokens should never be returned by the API.

---

# 2. History

Stores operation metadata for authenticated users and guest users.

## Collection

```txt
histories
```

## Schema

| Field              | Type     | Required | Description                                             |
| ------------------ | -------- | -------: | ------------------------------------------------------- |
| `_id`              | ObjectId |      Yes | Unique history record identifier                        |
| `accountId`        | ObjectId |       No | References Account for authenticated users              |
| `sessionId`        | String   |       No | Temporary guest session identifier                      |
| `originalImageUrl` | String   |       No | Optional future URL for original image storage          |
| `enhancedImageUrl` | String   |       No | Optional future URL for enhanced/restored image storage |
| `operationType`    | String   |      Yes | Operation performed                                     |
| `processingMode`   | String   |      Yes | Where processing occurred                               |
| `settingsUsed`     | Object   |       No | Settings used during the operation                      |
| `outputFormat`     | String   |       No | Export or AI output format                              |
| `processingTimeMs` | Number   |       No | Processing duration in milliseconds                     |
| `status`           | String   |      Yes | Processing result status                                |
| `errorCode`        | String   |       No | Error code if operation failed                          |
| `createdAt`        | Date     |      Yes | History record creation timestamp                       |

## Allowed `operationType` Values

```txt
adjust
filter
crop
rotate
flip
text_overlay
restore_face
export
```

## Allowed `processingMode` Values

```txt
browser
cloud_ai
```

## Allowed `status` Values

```txt
success
failed
```

## Example Document

```json
{
  "_id": "65f1a2b3c4d5e6f7a8b9c0d2",
  "accountId": "65f1a2b3c4d5e6f7a8b9c0d1",
  "sessionId": null,
  "originalImageUrl": null,
  "enhancedImageUrl": null,
  "operationType": "restore_face",
  "processingMode": "cloud_ai",
  "settingsUsed": {
    "model": "CodeFormer",
    "fidelity": 0.7
  },
  "outputFormat": "jpeg",
  "processingTimeMs": 4200,
  "status": "success",
  "errorCode": null,
  "createdAt": "2026-06-06T08:15:00.000Z"
}
```

## Notes

* For authenticated users, `accountId` is used.
* For guest users, `sessionId` is used.
* At least one of `accountId` or `sessionId` should be present.
* `originalImageUrl` and `enhancedImageUrl` are nullable because permanent image storage is excluded from the MVP.
* Browser-side manual edits may create history metadata, but the backend does not process the image.
* AI restoration history uses `processingMode: cloud_ai`.

---

# 3. Preset

Stores reusable adjustment and filter configurations for authenticated users.

## Collection

```txt
presets
```

## Schema

| Field                 | Type     | Required | Description                                 |
| --------------------- | -------- | -------: | ------------------------------------------- |
| `_id`                 | ObjectId |      Yes | Unique preset identifier                    |
| `accountId`           | ObjectId |      Yes | References the Account that owns the preset |
| `presetName`          | String   |      Yes | User-defined preset name                    |
| `enhancementSettings` | Object   |      Yes | Saved adjustment/filter configuration       |
| `createdAt`           | Date     |      Yes | Preset creation timestamp                   |
| `updatedAt`           | Date     |      Yes | Last preset update timestamp                |

## Example Document

```json
{
  "_id": "65f1a2b3c4d5e6f7a8b9c0d3",
  "accountId": "65f1a2b3c4d5e6f7a8b9c0d1",
  "presetName": "Warm Vintage",
  "enhancementSettings": {
    "schemaVersion": "2.0.0",
    "light": {
      "exposure": 5,
      "contrast": -5,
      "highlights": -12,
      "shadows": 10,
      "whites": 4,
      "blacks": -8
    },
    "color": {
      "temperature": 8,
      "tint": 0,
      "saturation": 25,
      "vibrance": 16
    },
    "effects": {
      "texture": 6,
      "clarity": 8,
      "vignette": {
        "amount": -20,
        "midpoint": 50,
        "roundness": 0,
        "feather": 50,
        "highlights": 0
      },
      "grain": {
        "amount": 0,
        "size": 25,
        "roughness": 50
      }
    },
    "detail": {
      "sharpening": {
        "amount": 20,
        "radius": 1,
        "detail": 25,
        "masking": 0
      }
    },
    "geometry": {
      "crop": {
        "x": 0,
        "y": 0,
        "width": 100,
        "height": 100,
        "aspectRatio": "none"
      },
      "rotate90": 0,
      "flipHorizontal": false,
      "flipVertical": false
    },
    "textOverlay": {
      "items": []
    },
    "filter": {
      "id": "vintage"
    }
  },
  "createdAt": "2026-06-06T08:30:00.000Z",
  "updatedAt": "2026-06-06T08:30:00.000Z"
}
```

## Notes

* Presets are only persisted for authenticated users.
* Guest users may import and apply preset JSON during the active session, but guest presets are not stored in MongoDB.
* Presets should store browser-side editing settings, not image files.
* `enhancementSettings.schemaVersion` identifies the browser preset settings model. Legacy flat payloads are migrated by the frontend before save/import.

---

# Relationships

## Account to History

```txt
Account (1) -> History (Many)
```

An authenticated account can have many history records.

Guest history records use `sessionId` instead of `accountId`.

---

## Account to Preset

```txt
Account (1) -> Preset (Many)
```

An authenticated account can create many presets.

---

# Recommended Indexes

## Account

```txt
email unique
```

## History

```txt
accountId + createdAt
sessionId + createdAt
operationType
processingMode
```

## Preset

```txt
accountId + presetName unique
accountId + createdAt
```

---

# Mongoose Model Notes

## Account Model Notes

* Use `email` as a unique indexed field.
* Store only `passwordHash`, never plain passwords.
* Store `encryptedHuggingFaceToken`, not plain Hugging Face tokens.
* Use `huggingFaceTokenConfigured` for safe frontend display.

## History Model Notes

* Use flexible `settingsUsed` object.
* Validate `operationType` using enum values.
* Validate `processingMode` using enum values.
* Do not require image URLs for MVP.
* Add validation so either `accountId` or `sessionId` exists.

## Preset Model Notes

* Scope presets by `accountId`.
* Enforce unique preset names per account.
* Store preset settings as an object, not a serialized string, because MongoDB natively supports nested JSON-like documents.

---

# Important Design Decisions

## No Offline Processing in Web Schema

The Web TDD excludes offline AI processing, local CodeFormer execution, local Real-ESRGAN execution, and server-side GPU processing.

Therefore, the Web database schema should not include an offline processing model for the MVP.

Valid Web processing modes are:

```txt
browser
cloud_ai
```

---

## No Permanent Image Storage by Default

The MVP stores history metadata only.

The following fields are optional and reserved for future storage support:

```txt
originalImageUrl
enhancedImageUrl
```

Future versions may use Cloudflare R2, S3, or another object storage provider.

---

## Hugging Face Token Handling

Guest users provide a Hugging Face token per AI restoration request.

Authenticated users may either:

1. Provide a token for the current request only.
2. Save an encrypted token to their account.

Only encrypted saved tokens are stored.

---

# Future Optional Collections

These are not required for the MVP but may be added later.

## GuestSession

Could be used if guest sessions need expiration tracking, abuse prevention, or rate limiting.

## AuditLog

Could be used for security-sensitive account or token actions.

## ImageAsset

Could be used if permanent image storage is added later.

