import { UnauthorizedException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PresetController } from "./preset.controller";
import { PresetService } from "./preset.service";

describe("PresetController", () => {
  const authenticatedRequest = {
    headers: {},
    user: {
      accountId: "account-1",
      email: "user@example.com",
      exp: 1780000000,
    },
  };
  const presetResponse = {
    success: true,
    message: "Preset created",
    preset: {
      id: "preset-1",
      presetName: "Warm Vintage",
      enhancementSettings: {
        exposure: 5,
      },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  };

  let presets: {
    listPresets: ReturnType<typeof vi.fn>;
    createPreset: ReturnType<typeof vi.fn>;
    updatePreset: ReturnType<typeof vi.fn>;
    deletePreset: ReturnType<typeof vi.fn>;
    importPreset: ReturnType<typeof vi.fn>;
    exportPreset: ReturnType<typeof vi.fn>;
  };
  let controller: PresetController;

  beforeEach(() => {
    presets = {
      listPresets: vi.fn(),
      createPreset: vi.fn(),
      updatePreset: vi.fn(),
      deletePreset: vi.fn(),
      importPreset: vi.fn(),
      exportPreset: vi.fn(),
    };
    controller = new PresetController(presets as unknown as PresetService);
  });

  it("lists presets for the authenticated account", async () => {
    presets.listPresets.mockResolvedValue({
      success: true,
      presets: [presetResponse.preset],
    });

    await expect(controller.listPresets(authenticatedRequest)).resolves.toMatchObject({
      success: true,
      presets: [presetResponse.preset],
    });
    expect(presets.listPresets).toHaveBeenCalledWith("account-1");
  });

  it("creates presets for the authenticated account", async () => {
    presets.createPreset.mockResolvedValue(presetResponse);

    await expect(
      controller.createPreset(authenticatedRequest, {
        presetName: "Warm Vintage",
        enhancementSettings: {
          exposure: 5,
        },
      }),
    ).resolves.toBe(presetResponse);
    expect(presets.createPreset).toHaveBeenCalledWith("account-1", {
      presetName: "Warm Vintage",
      enhancementSettings: {
        exposure: 5,
      },
    });
  });

  it("updates and deletes presets by authenticated ownership", async () => {
    presets.updatePreset.mockResolvedValue({
      ...presetResponse,
      message: "Preset updated",
    });
    presets.deletePreset.mockResolvedValue({
      success: true,
      message: "Preset deleted",
    });

    await expect(
      controller.updatePreset(authenticatedRequest, "preset-1", {
        presetName: "Warm Portrait",
      }),
    ).resolves.toMatchObject({
      message: "Preset updated",
    });
    await expect(controller.deletePreset(authenticatedRequest, "preset-1")).resolves.toEqual({
      success: true,
      message: "Preset deleted",
    });
    expect(presets.updatePreset).toHaveBeenCalledWith("account-1", "preset-1", {
      presetName: "Warm Portrait",
    });
    expect(presets.deletePreset).toHaveBeenCalledWith("account-1", "preset-1");
  });

  it("imports and exports presets for the authenticated account", async () => {
    presets.importPreset.mockResolvedValue({
      ...presetResponse,
      message: "Preset imported",
    });
    presets.exportPreset.mockResolvedValue({
      presetName: "Warm Vintage",
      enhancementSettings: {
        exposure: 5,
      },
    });

    await expect(
      controller.importPreset(authenticatedRequest, {
        presetName: "Warm Vintage",
        enhancementSettings: {
          exposure: 5,
        },
      }),
    ).resolves.toMatchObject({
      message: "Preset imported",
    });
    await expect(controller.exportPreset(authenticatedRequest, "preset-1")).resolves.toEqual({
      presetName: "Warm Vintage",
      enhancementSettings: {
        exposure: 5,
      },
    });
    expect(presets.importPreset).toHaveBeenCalledWith("account-1", {
      presetName: "Warm Vintage",
      enhancementSettings: {
        exposure: 5,
      },
    });
    expect(presets.exportPreset).toHaveBeenCalledWith("account-1", "preset-1");
  });

  it("rejects requests without authenticated request state", () => {
    const anonymousRequest = {
      headers: {},
    };

    expect(() => controller.listPresets(anonymousRequest)).toThrow(UnauthorizedException);
    expect(() =>
      controller.createPreset(anonymousRequest, {
        presetName: "Warm Vintage",
        enhancementSettings: {
          exposure: 5,
        },
      }),
    ).toThrow(UnauthorizedException);
    expect(() => controller.exportPreset(anonymousRequest, "preset-1")).toThrow(
      UnauthorizedException,
    );
  });
});
