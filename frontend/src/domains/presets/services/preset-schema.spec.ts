import { describe, expect, it } from "vitest";
import {
  createPresetEnhancementSettings,
  parsePresetJsonPayload,
  PRESET_SCHEMA_VERSION,
  PresetSchemaError,
  toEditorPresetSettings,
} from "./preset-schema";

describe("preset schema v2", () => {
  it("creates versioned Lightroom-inspired enhancement settings", () => {
    const settings = createPresetEnhancementSettings({
      adjustments: {
        brightness: 0,
        exposure: 12,
        contrast: -4,
        highlights: 8,
        shadows: -6,
        whites: 10,
        blacks: -12,
        saturation: 14,
        vibrance: 18,
        warmth: 0,
        temperature: 22,
        tint: -8,
        texture: 9,
        clarity: 11,
        vignetteAmount: -30,
        vignetteMidpoint: 40,
        vignetteRoundness: 2,
        vignetteFeather: 60,
        vignetteHighlights: 5,
        grainAmount: 20,
        grainSize: 35,
        grainRoughness: 45,
        sharpeningAmount: 50,
        sharpeningRadius: 1,
        sharpeningDetail: 25,
        sharpeningMasking: 10,
      },
      filterPresetId: "vignette",
      cropPresetId: "free",
      freeCrop: { x: 10, y: 12, width: 70, height: 68 },
      rotation: 90,
      flipHorizontal: true,
      flipVertical: false,
      textOverlays: [{ id: "text-1", text: "Lumina", color: "#ffffff", size: 32, x: 48, y: 52 }],
    });

    expect(settings).toMatchObject({
      schemaVersion: PRESET_SCHEMA_VERSION,
      light: { exposure: 12, whites: 10, blacks: -12 },
      color: { temperature: 22, tint: -8 },
      effects: { vignette: { amount: -30 }, grain: { amount: 20 } },
      detail: { sharpening: { amount: 50 } },
      geometry: { crop: { x: 10, aspectRatio: "free" }, rotate90: 90, flipHorizontal: true },
      textOverlay: { items: [{ text: "Lumina" }] },
      filter: { id: "vignette" },
    });
  });

  it("migrates legacy editor presets into editor settings", () => {
    expect(
      toEditorPresetSettings({
        adjustments: { brightness: 15, warmth: 20 },
        filterPresetId: "warm",
        cropPresetId: "square",
        freeCrop: { x: 5, y: 6, width: 80, height: 70 },
        rotation: 180,
        flipHorizontal: true,
        textOverlays: [{ text: "Old preset", color: "#f87171", size: 24, x: 10, y: 15 }],
      }),
    ).toMatchObject({
      adjustments: { brightness: 15, temperature: 20 },
      filterPresetId: "warm",
      cropPresetId: "square",
      freeCrop: { x: 5, y: 6, width: 80, height: 70 },
      rotation: 180,
      flipHorizontal: true,
      textOverlays: [{ text: "Old preset" }],
    });
  });

  it("parses v2 import JSON and rejects unsafe or malformed payloads", () => {
    expect(
      parsePresetJsonPayload({
        presetName: "Imported V2",
        enhancementSettings: {
          schemaVersion: PRESET_SCHEMA_VERSION,
          light: { exposure: 6 },
          color: { temperature: 12 },
          geometry: { crop: { x: 2, y: 3, width: 90, height: 91, aspectRatio: "free" } },
          filter: { id: "sepia" },
        },
      }),
    ).toMatchObject({
      presetName: "Imported V2",
      enhancementSettings: {
        schemaVersion: PRESET_SCHEMA_VERSION,
        light: { exposure: 6 },
        color: { temperature: 12 },
        geometry: { crop: { x: 2, aspectRatio: "free" } },
        filter: { id: "sepia" },
      },
    });

    expect(() => parsePresetJsonPayload({ presetName: "", enhancementSettings: {} })).toThrow(PresetSchemaError);
    expect(() =>
      parsePresetJsonPayload({
        presetName: "Unsafe",
        enhancementSettings: JSON.parse('{"__proto__":{"polluted":true}}') as unknown,
      }),
    ).toThrow(PresetSchemaError);
  });
});
