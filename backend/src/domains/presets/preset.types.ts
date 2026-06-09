export interface PresetRequestDto {
  presetName?: unknown;
  enhancementSettings?: unknown;
}

export type CreatePresetRequestDto = PresetRequestDto;

export type UpdatePresetRequestDto = PresetRequestDto;

export type ImportPresetRequestDto = PresetRequestDto;

export interface PresetDto {
  id: string;
  presetName: string;
  enhancementSettings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PresetListResponseDto {
  success: true;
  presets: PresetDto[];
}

export interface PresetResponseDto {
  success: true;
  message: string;
  preset: PresetDto;
}

export interface DeletePresetResponseDto {
  success: true;
  message: string;
}

export interface ExportPresetResponseDto {
  presetName: string;
  enhancementSettings: Record<string, unknown>;
}
