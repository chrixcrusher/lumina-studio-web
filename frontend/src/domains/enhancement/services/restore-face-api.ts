import { apiRequest } from "@/infrastructure/api/api-client";
import type { RestoreFaceRequest, RestoreFaceResponse } from "../types/restore-face";

export async function restoreFace(payload: RestoreFaceRequest): Promise<RestoreFaceResponse> {
  return apiRequest<RestoreFaceResponse>("/api/v1/ai/restore-face", {
    method: "POST",
    headers: payload.sessionId ? { "x-session-id": payload.sessionId } : undefined,
    body: {
      image: payload.image,
      huggingFaceToken: payload.huggingFaceToken,
      useSavedToken: payload.useSavedToken,
      settings: payload.settings,
      outputFormat: payload.outputFormat,
    },
  });
}
