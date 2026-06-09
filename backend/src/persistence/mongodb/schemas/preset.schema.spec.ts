import { model } from "mongoose";
import { describe, expect, it } from "vitest";
import { PRESET_COLLECTION, Preset, PresetSchema } from "./preset.schema";

const PresetSchemaSpecModel = model<Preset>("PresetSchemaSpec", PresetSchema.clone());

describe("PresetSchema", () => {
  it("uses the canonical presets collection and timestamps", () => {
    expect(PresetSchema.options.collection).toBe(PRESET_COLLECTION);
    expect(PresetSchema.options.timestamps).toBe(true);
  });

  it("defines account-scoped preset indexes", () => {
    const hasUniqueNamePerAccountIndex = PresetSchema.indexes().some(([fields, options]) => {
      return fields.accountId === 1 && fields.presetName === 1 && options.unique === true;
    });
    const hasAccountCreatedAtIndex = PresetSchema.indexes().some(([fields]) => {
      return fields.accountId === 1 && fields.createdAt === -1;
    });

    expect(hasUniqueNamePerAccountIndex).toBe(true);
    expect(hasAccountCreatedAtIndex).toBe(true);
  });

  it("validates required preset fields and stores object-based settings", async () => {
    const preset = new PresetSchemaSpecModel({
      accountId: "65f1a2b3c4d5e6f7a8b9c0d1",
      presetName: " Warm Vintage ",
      enhancementSettings: {
        exposure: 5,
        contrast: -5,
        saturation: 25,
        filter: "vintage",
      },
    });

    await expect(preset.validate()).resolves.toBeUndefined();
    expect(preset.presetName).toBe("Warm Vintage");
    expect(preset.enhancementSettings).toEqual({
      exposure: 5,
      contrast: -5,
      saturation: 25,
      filter: "vintage",
    });
  });

  it("rejects invalid preset records", async () => {
    const preset = new PresetSchemaSpecModel({
      presetName: "Incomplete",
    });

    await expect(preset.validate()).rejects.toMatchObject({
      errors: {
        accountId: expect.anything(),
        enhancementSettings: expect.anything(),
      },
    });
  });
});
