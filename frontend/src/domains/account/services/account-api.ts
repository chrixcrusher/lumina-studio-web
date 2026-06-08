import { apiRequest } from "@/infrastructure/api/api-client";
import type {
  HuggingFaceTokenStatus,
  SaveHuggingFaceTokenRequest,
} from "../types/account";

export const accountApi = {
  saveHuggingFaceToken(payload: SaveHuggingFaceTokenRequest) {
    return apiRequest<HuggingFaceTokenStatus>("/api/v1/account/hugging-face-token", {
      method: "PUT",
      body: payload,
    });
  },
  deleteHuggingFaceToken() {
    return apiRequest<HuggingFaceTokenStatus>("/api/v1/account/hugging-face-token", {
      method: "DELETE",
    });
  },
};
