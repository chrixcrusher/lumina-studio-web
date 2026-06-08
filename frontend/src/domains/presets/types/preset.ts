export interface Preset {
  id: string;
  presetName: string;
  enhancementSettings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SavePresetRequest {
  presetName: string;
  enhancementSettings: Record<string, unknown>;
}
