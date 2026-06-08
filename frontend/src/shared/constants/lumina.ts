export const ACCOUNT_FIELD_NAMES = {
  encryptedHuggingFaceToken: "encryptedHuggingFaceToken",
  huggingFaceTokenConfigured: "huggingFaceTokenConfigured",
} as const;

export const PROCESSING_MODES = {
  browser: "browser",
  cloudAi: "cloud_ai",
} as const;

export const OPERATION_TYPES = {
  adjust: "adjust",
  filter: "filter",
  crop: "crop",
  rotate: "rotate",
  flip: "flip",
  textOverlay: "text_overlay",
  restoreFace: "restore_face",
  export: "export",
} as const;

export const EDITOR_FILTERS = ["Vivid", "Black and White", "Vintage", "Warm", "Cool"] as const;

export const TRANSFORM_TOOLS = ["Crop", "Rotate", "Flip", "Text"] as const;

export const WEB_MVP_IMAGE_PROCESSING_ROUTES = {
  restoreFace: "POST /api/v1/ai/restore-face",
} as const;

export const DISALLOWED_WEB_MVP_IMAGE_PROCESSING_ROUTES = [
  "POST /api/v1/enhance/offline",
  "POST /api/v1/enhance/manual",
] as const;

export const ERROR_RESPONSE_FIELDS = {
  message: "message",
  statusCode: "statusCode",
  error: "error",
} as const;

export type AccountFieldName = (typeof ACCOUNT_FIELD_NAMES)[keyof typeof ACCOUNT_FIELD_NAMES];
export type ProcessingMode = (typeof PROCESSING_MODES)[keyof typeof PROCESSING_MODES];
export type OperationType = (typeof OPERATION_TYPES)[keyof typeof OPERATION_TYPES];
