import { apiRequest } from "@/infrastructure/api/api-client";
import type { Preset, SavePresetRequest } from "../types/preset";

export const presetsApi = {
  list() {
    return apiRequest<Preset[]>("/api/v1/presets");
  },
  create(payload: SavePresetRequest) {
    return apiRequest<Preset>("/api/v1/presets", {
      method: "POST",
      body: payload,
    });
  },
  update(id: string, payload: SavePresetRequest) {
    return apiRequest<Preset>(`/api/v1/presets/${id}`, {
      method: "PUT",
      body: payload,
    });
  },
  delete(id: string) {
    return apiRequest<void>(`/api/v1/presets/${id}`, {
      method: "DELETE",
    });
  },
  import(payload: SavePresetRequest) {
    return apiRequest<Preset>("/api/v1/presets/import", {
      method: "POST",
      body: payload,
    });
  },
  export(id: string) {
    return apiRequest<Preset>(`/api/v1/presets/${id}/export`);
  },
};
