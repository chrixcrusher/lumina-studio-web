import type { RestoreFaceRequest, RestoreFaceResponse } from "../types/restore-face";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function restoreFace(payload: RestoreFaceRequest): Promise<RestoreFaceResponse> {
  const formData = new FormData();
  formData.append("image", payload.imageFile);

  if (payload.huggingFaceToken) {
    formData.append("huggingFaceToken", payload.huggingFaceToken);
  }

  if (payload.useSavedToken !== undefined) {
    formData.append("useSavedToken", String(payload.useSavedToken));
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/ai/restore-face`, {
    method: "POST",
    headers: payload.sessionId ? { "x-session-id": payload.sessionId } : undefined,
    body: formData,
  });

  if (!response.ok) {
    throw new Error("AI face restoration failed");
  }

  return response.json() as Promise<RestoreFaceResponse>;
}
