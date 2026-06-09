import { apiRequest, getApiAuthToken } from "@/infrastructure/api/api-client";
import { getOrCreateGuestSessionId } from "@/shared/guest-session";
import type { CreateHistoryRequest, CreateHistoryResponse, HistoryRecord } from "../types/history";

interface HistoryListResponse {
  success: true;
  history: HistoryRecord[];
}

interface DeleteHistoryResponse {
  success: true;
  message: string;
}

export const historyApi = {
  async list() {
    const response = await apiRequest<HistoryListResponse>("/api/v1/history", {
      headers: historyOwnershipHeaders(),
    });

    return response.history;
  },
  create(payload: CreateHistoryRequest) {
    return apiRequest<CreateHistoryResponse>("/api/v1/history", {
      method: "POST",
      body: payload,
      headers: historyOwnershipHeaders(),
    });
  },
  async delete(id: string) {
    await apiRequest<DeleteHistoryResponse>(`/api/v1/history/${id}`, {
      method: "DELETE",
      headers: historyOwnershipHeaders(),
    });
  },
};

function historyOwnershipHeaders(): HeadersInit | undefined {
  if (getApiAuthToken()) {
    return undefined;
  }

  return {
    "x-session-id": getOrCreateGuestSessionId(),
  };
}
