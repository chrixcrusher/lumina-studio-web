import { apiRequest } from "@/infrastructure/api/api-client";
import type { CreateHistoryRequest, HistoryRecord } from "../types/history";

export const historyApi = {
  list() {
    return apiRequest<HistoryRecord[]>("/api/v1/history");
  },
  create(payload: CreateHistoryRequest) {
    return apiRequest<HistoryRecord>("/api/v1/history", {
      method: "POST",
      body: payload,
    });
  },
  delete(id: string) {
    return apiRequest<void>(`/api/v1/history/${id}`, {
      method: "DELETE",
    });
  },
};
