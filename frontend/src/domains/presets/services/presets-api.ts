import { apiRequest } from "@/infrastructure/api/api-client";
import type { Preset, SavePresetRequest } from "../types/preset";

interface PresetListResponse {
  success: true;
  presets: Preset[];
}

interface PresetResponse {
  success: true;
  message: string;
  preset: Preset;
}

interface DeletePresetResponse {
  success: true;
  message: string;
}

export const presetsApi = {
  async list() {
    const response = await apiRequest<PresetListResponse>("/api/v1/presets");

    return response.presets;
  },
  async create(payload: SavePresetRequest) {
    const response = await apiRequest<PresetResponse>("/api/v1/presets", {
      method: "POST",
      body: payload,
    });

    return response.preset;
  },
  async update(id: string, payload: SavePresetRequest) {
    const response = await apiRequest<PresetResponse>(`/api/v1/presets/${id}`, {
      method: "PUT",
      body: payload,
    });

    return response.preset;
  },
  async delete(id: string) {
    await apiRequest<DeletePresetResponse>(`/api/v1/presets/${id}`, {
      method: "DELETE",
    });
  },
  async import(payload: SavePresetRequest) {
    const response = await apiRequest<PresetResponse>("/api/v1/presets/import", {
      method: "POST",
      body: payload,
    });

    return response.preset;
  },
  export(id: string) {
    return apiRequest<SavePresetRequest>(`/api/v1/presets/${id}/export`);
  },
};
