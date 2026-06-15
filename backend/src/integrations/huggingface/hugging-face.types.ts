export interface HuggingFaceInferenceRequest {
  imageBase64: string;
  huggingFaceToken: string;
  contentType: string;
  fidelity?: number;
  timeoutMs?: number;
}

export interface HuggingFaceInferenceResponse {
  imageBase64: string;
  contentType: string;
}

export interface CodeFormerRestoreFaceRequest {
  imageBase64: string;
  contentType: string;
  huggingFaceToken: string;
  fidelity?: number;
  outputFormat?: string;
}

export interface CodeFormerRestoreFaceResponse {
  restoredImage: string;
  settingsUsed: {
    model: "CodeFormer";
    fidelity?: number;
  };
  outputFormat?: string;
}
