export interface RestoreFaceRequest {
  imageFile: File;
  huggingFaceToken?: string;
  useSavedToken?: boolean;
  sessionId?: string;
}

export interface RestoreFaceResponse {
  imageData: string;
  outputFormat: string;
  processingTimeMs?: number;
}
