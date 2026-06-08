export interface SaveHuggingFaceTokenRequestDto {
  huggingFaceToken?: unknown;
}

export interface HuggingFaceTokenStatusResponseDto {
  success: true;
  message: string;
  huggingFaceTokenConfigured: boolean;
}
