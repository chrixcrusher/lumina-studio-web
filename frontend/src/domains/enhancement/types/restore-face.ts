export interface RestoreFaceRequest {
  image: string;
  huggingFaceToken?: string;
  useSavedToken?: boolean;
  sessionId?: string;
  settings?: {
    fidelity?: number;
  };
  outputFormat?: "jpeg" | "png" | "webp";
}

export interface RestoreFaceResponse {
  success: true;
  message: string;
  restoredImage: string;
  historyId: string;
  operationType: "restore_face";
  processingMode: "cloud_ai";
  settingsUsed: {
    model: "CodeFormer";
    fidelity?: number;
  };
  outputFormat?: string;
  processingTimeMs?: number;
}
