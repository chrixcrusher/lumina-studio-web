export interface HuggingFaceTokenStatus {
  success: true;
  message: string;
  huggingFaceTokenConfigured: boolean;
}

export interface SaveHuggingFaceTokenRequest {
  huggingFaceToken: string;
}
