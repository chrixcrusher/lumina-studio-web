import type { SavePresetRequest } from "../types/preset";

export const PRESET_SCHEMA_VERSION = "2.0.0";

export interface EditorPresetAdjustments {
  brightness: number;
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  saturation: number;
  vibrance: number;
  warmth: number;
  temperature: number;
  tint: number;
  texture: number;
  clarity: number;
  vignetteAmount: number;
  vignetteMidpoint: number;
  vignetteRoundness: number;
  vignetteFeather: number;
  vignetteHighlights: number;
  grainAmount: number;
  grainSize: number;
  grainRoughness: number;
  sharpeningAmount: number;
  sharpeningRadius: number;
  sharpeningDetail: number;
  sharpeningMasking: number;
}

export interface EditorPresetFreeCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EditorPresetTextOverlay {
  id: string;
  text: string;
  color: string;
  size: number;
  x: number;
  y: number;
}

export interface EditorPresetSettings {
  adjustments?: Partial<EditorPresetAdjustments>;
  filterPresetId?: string;
  cropPresetId?: string;
  freeCrop?: Partial<EditorPresetFreeCrop>;
  rotation?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  textOverlays?: EditorPresetTextOverlay[];
}

export class PresetSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PresetSchemaError";
  }
}

const blockedObjectKeys = new Set(["__proto__", "constructor", "prototype"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function readRecord(value: unknown) {
  return isRecord(value) ? value : {};
}

function assertSafeJson(value: unknown, path = "preset", depth = 0): void {
  if (depth > 12) {
    throw new PresetSchemaError(`${path} is nested too deeply.`);
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafeJson(item, `${path}[${index}]`, depth + 1));
    return;
  }

  if (!isRecord(value)) return;

  for (const [key, child] of Object.entries(value)) {
    if (blockedObjectKeys.has(key)) {
      throw new PresetSchemaError(`Preset JSON contains an unsafe field: ${key}.`);
    }

    assertSafeJson(child, `${path}.${key}`, depth + 1);
  }
}

function normalizeTextOverlays(value: unknown): EditorPresetTextOverlay[] | undefined {
  if (!Array.isArray(value)) return undefined;

  return value.filter(isRecord).map((overlay, index) => ({
    id: readString(overlay.id) ?? `preset-text-${index}`,
    text: readString(overlay.text) ?? "",
    color: readString(overlay.color) ?? "#ffffff",
    size: readNumber(overlay.size, 34),
    x: readNumber(overlay.x, 50),
    y: readNumber(overlay.y, 50),
  }));
}

export function createPresetEnhancementSettings({
  adjustments,
  filterPresetId,
  cropPresetId,
  freeCrop,
  rotation,
  flipHorizontal,
  flipVertical,
  textOverlays,
}: {
  adjustments: EditorPresetAdjustments;
  filterPresetId: string;
  cropPresetId: string;
  freeCrop: EditorPresetFreeCrop;
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  textOverlays: EditorPresetTextOverlay[];
}): Record<string, unknown> {
  return {
    schemaVersion: PRESET_SCHEMA_VERSION,
    light: {
      brightness: adjustments.brightness,
      exposure: adjustments.exposure,
      contrast: adjustments.contrast,
      highlights: adjustments.highlights,
      shadows: adjustments.shadows,
      whites: adjustments.whites,
      blacks: adjustments.blacks,
    },
    color: {
      temperature: adjustments.temperature,
      tint: adjustments.tint,
      vibrance: adjustments.vibrance,
      saturation: adjustments.saturation,
      warmth: adjustments.warmth,
    },
    effects: {
      texture: adjustments.texture,
      clarity: adjustments.clarity,
      vignette: {
        amount: adjustments.vignetteAmount,
        midpoint: adjustments.vignetteMidpoint,
        roundness: adjustments.vignetteRoundness,
        feather: adjustments.vignetteFeather,
        highlights: adjustments.vignetteHighlights,
      },
      grain: {
        amount: adjustments.grainAmount,
        size: adjustments.grainSize,
        roughness: adjustments.grainRoughness,
      },
    },
    detail: {
      sharpening: {
        amount: adjustments.sharpeningAmount,
        radius: adjustments.sharpeningRadius,
        detail: adjustments.sharpeningDetail,
        masking: adjustments.sharpeningMasking,
      },
    },
    geometry: {
      crop: {
        x: freeCrop.x,
        y: freeCrop.y,
        width: freeCrop.width,
        height: freeCrop.height,
        aspectRatio: cropPresetId,
      },
      rotate90: rotation,
      flipHorizontal,
      flipVertical,
    },
    textOverlay: {
      items: textOverlays,
    },
    filter: {
      id: filterPresetId,
    },
  };
}

export function toEditorPresetSettings(value: unknown): EditorPresetSettings {
  if (!isRecord(value)) return {};

  const light = readRecord(value.light);
  const color = readRecord(value.color);
  const effects = readRecord(value.effects);
  const vignette = readRecord(effects.vignette);
  const grain = readRecord(effects.grain);
  const detail = readRecord(value.detail);
  const sharpening = readRecord(detail.sharpening);
  const geometry = readRecord(value.geometry);
  const geometryCrop = readRecord(geometry.crop);
  const filter = readRecord(value.filter);
  const textOverlay = readRecord(value.textOverlay);

  const legacyAdjustments = readRecord(value.adjustments);
  const legacyFreeCrop = readRecord(value.freeCrop);
  const legacyOverlays = normalizeTextOverlays(value.textOverlays);
  const v2Overlays = normalizeTextOverlays(textOverlay.items);

  return {
    adjustments: {
      brightness: readNumber(light.brightness, readNumber(legacyAdjustments.brightness, 0)),
      exposure: readNumber(light.exposure, readNumber(legacyAdjustments.exposure, 0)),
      contrast: readNumber(light.contrast, readNumber(legacyAdjustments.contrast, 0)),
      highlights: readNumber(light.highlights, readNumber(legacyAdjustments.highlights, 0)),
      shadows: readNumber(light.shadows, readNumber(legacyAdjustments.shadows, 0)),
      whites: readNumber(light.whites, readNumber(legacyAdjustments.whites, 0)),
      blacks: readNumber(light.blacks, readNumber(legacyAdjustments.blacks, 0)),
      saturation: readNumber(color.saturation, readNumber(legacyAdjustments.saturation, 0)),
      vibrance: readNumber(color.vibrance, readNumber(legacyAdjustments.vibrance, 0)),
      warmth: readNumber(color.warmth, readNumber(color.temperature, readNumber(legacyAdjustments.warmth, 0))),
      temperature: readNumber(color.temperature, readNumber(legacyAdjustments.temperature, readNumber(legacyAdjustments.warmth, 0))),
      tint: readNumber(color.tint, readNumber(legacyAdjustments.tint, 0)),
      texture: readNumber(effects.texture, readNumber(legacyAdjustments.texture, 0)),
      clarity: readNumber(effects.clarity, readNumber(legacyAdjustments.clarity, 0)),
      vignetteAmount: readNumber(vignette.amount, readNumber(legacyAdjustments.vignetteAmount, 0)),
      vignetteMidpoint: readNumber(vignette.midpoint, readNumber(legacyAdjustments.vignetteMidpoint, 50)),
      vignetteRoundness: readNumber(vignette.roundness, readNumber(legacyAdjustments.vignetteRoundness, 0)),
      vignetteFeather: readNumber(vignette.feather, readNumber(legacyAdjustments.vignetteFeather, 50)),
      vignetteHighlights: readNumber(vignette.highlights, readNumber(legacyAdjustments.vignetteHighlights, 0)),
      grainAmount: readNumber(grain.amount, readNumber(legacyAdjustments.grainAmount, 0)),
      grainSize: readNumber(grain.size, readNumber(legacyAdjustments.grainSize, 25)),
      grainRoughness: readNumber(grain.roughness, readNumber(legacyAdjustments.grainRoughness, 50)),
      sharpeningAmount: readNumber(sharpening.amount, readNumber(legacyAdjustments.sharpeningAmount, 0)),
      sharpeningRadius: readNumber(sharpening.radius, readNumber(legacyAdjustments.sharpeningRadius, 1)),
      sharpeningDetail: readNumber(sharpening.detail, readNumber(legacyAdjustments.sharpeningDetail, 25)),
      sharpeningMasking: readNumber(sharpening.masking, readNumber(legacyAdjustments.sharpeningMasking, 0)),
    },
    filterPresetId: readString(filter.id) ?? readString(value.filterPresetId),
    cropPresetId: readString(geometryCrop.aspectRatio) ?? readString(value.cropPresetId),
    freeCrop: {
      x: readNumber(geometryCrop.x, readNumber(legacyFreeCrop.x, 0)),
      y: readNumber(geometryCrop.y, readNumber(legacyFreeCrop.y, 0)),
      width: readNumber(geometryCrop.width, readNumber(legacyFreeCrop.width, 100)),
      height: readNumber(geometryCrop.height, readNumber(legacyFreeCrop.height, 100)),
    },
    rotation: readNumber(geometry.rotate90, readNumber(value.rotation, 0)),
    flipHorizontal: readBoolean(geometry.flipHorizontal, readBoolean(value.flipHorizontal, false)),
    flipVertical: readBoolean(geometry.flipVertical, readBoolean(value.flipVertical, false)),
    textOverlays: v2Overlays ?? legacyOverlays,
  };
}

export function migratePresetEnhancementSettings(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new PresetSchemaError("Preset JSON is missing enhancementSettings.");
  }

  assertSafeJson(value, "enhancementSettings");

  const normalized = toEditorPresetSettings(value);
  return createPresetEnhancementSettings({
    adjustments: {
      brightness: 0,
      exposure: 0,
      contrast: 0,
      highlights: 0,
      shadows: 0,
      whites: 0,
      blacks: 0,
      saturation: 0,
      vibrance: 0,
      warmth: 0,
      temperature: 0,
      tint: 0,
      texture: 0,
      clarity: 0,
      vignetteAmount: 0,
      vignetteMidpoint: 50,
      vignetteRoundness: 0,
      vignetteFeather: 50,
      vignetteHighlights: 0,
      grainAmount: 0,
      grainSize: 25,
      grainRoughness: 50,
      sharpeningAmount: 0,
      sharpeningRadius: 1,
      sharpeningDetail: 25,
      sharpeningMasking: 0,
      ...normalized.adjustments,
    },
    filterPresetId: normalized.filterPresetId ?? "original",
    cropPresetId: normalized.cropPresetId ?? "none",
    freeCrop: {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      ...normalized.freeCrop,
    },
    rotation: normalized.rotation ?? 0,
    flipHorizontal: normalized.flipHorizontal ?? false,
    flipVertical: normalized.flipVertical ?? false,
    textOverlays: normalized.textOverlays ?? [],
  });
}

export function parsePresetJsonPayload(value: unknown): SavePresetRequest {
  if (!isRecord(value)) {
    throw new PresetSchemaError("Preset JSON must be an object.");
  }

  assertSafeJson(value);

  const presetName = readString(value.presetName)?.trim();
  if (!presetName) {
    throw new PresetSchemaError("Preset JSON is missing a name.");
  }

  return {
    presetName,
    enhancementSettings: migratePresetEnhancementSettings(value.enhancementSettings),
  };
}
