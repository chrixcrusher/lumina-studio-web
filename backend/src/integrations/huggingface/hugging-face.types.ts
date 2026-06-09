export interface HuggingFaceInferenceRequest {
  model: string;
  imageBase64: string;
  huggingFaceToken: string;
  contentType?: string;
  timeoutMs?: number;
}

export interface HuggingFaceInferenceResponse {
  imageBase64: string;
  contentType: string;
}

export interface CodeFormerRestoreFaceRequest {
  imageBase64: string;
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
