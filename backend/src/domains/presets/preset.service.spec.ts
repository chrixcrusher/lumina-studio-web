import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PresetRepository } from "../../persistence/repositories/preset.repository";
import { PresetDocument } from "../../persistence/mongodb/schemas/preset.schema";
import { PresetService } from "./preset.service";

describe("PresetService", () => {
  const accountId = "account-1";
  const createdAt = new Date("2026-01-01T00:00:00.000Z");
  const updatedAt = new Date("2026-01-02T00:00:00.000Z");
  const presetDocument = {
    id: "preset-1",
    accountId,
    presetName: "Warm Vintage",
    enhancementSettings: {
      exposure: 5,
      contrast: -5,
      filter: "vintage",
    },
    createdAt,
    updatedAt,
  } as unknown as PresetDocument;

  let presets: {
    create: ReturnType<typeof vi.fn>;
    findByAccountId: ReturnType<typeof vi.fn>;
    findByIdForAccount: ReturnType<typeof vi.fn>;
    updateByIdForAccount: ReturnType<typeof vi.fn>;
    deleteByIdForAccount: ReturnType<typeof vi.fn>;
  };
  let service: PresetService;

  beforeEach(() => {
    presets = {
      create: vi.fn(),
      findByAccountId: vi.fn(),
      findByIdForAccount: vi.fn(),
      updateByIdForAccount: vi.fn(),
      deleteByIdForAccount: vi.fn(),
    };
    service = new PresetService(presets as unknown as PresetRepository);
  });

  it("lists presets owned by the authenticated account", async () => {
    presets.findByAccountId.mockResolvedValue([presetDocument]);

    await expect(service.listPresets(accountId)).resolves.toEqual({
      success: true,
      presets: [
        {
          id: "preset-1",
          presetName: "Warm Vintage",
          enhancementSettings: {
            exposure: 5,
            contrast: -5,
            filter: "vintage",
          },
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
        },
      ],
    });
    expect(presets.findByAccountId).toHaveBeenCalledWith(accountId);
  });

  it("creates presets with normalized presetName and object enhancementSettings", async () => {
    presets.create.mockResolvedValue(presetDocument);

    await expect(
      service.createPreset(accountId, {
        presetName: " Warm Vintage ",
        enhancementSettings: {
          exposure: 5,
        },
      }),
    ).resolves.toMatchObject({
      success: true,
      message: "Preset created",
      preset: {
        id: "preset-1",
        presetName: "Warm Vintage",
      },
    });
    expect(presets.create).toHaveBeenCalledWith({
      accountId,
      presetName: "Warm Vintage",
      enhancementSettings: {
        exposure: 5,
      },
    });
  });

  it("updates only an owned preset", async () => {
    presets.updateByIdForAccount.mockResolvedValue(presetDocument);

    await expect(
      service.updatePreset(accountId, "preset-1", {
        presetName: "Warm Portrait",
      }),
    ).resolves.toMatchObject({
      success: true,
      message: "Preset updated",
    });
    expect(presets.updateByIdForAccount).toHaveBeenCalledWith(accountId, "preset-1", {
      presetName: "Warm Portrait",
    });
  });

  it("deletes only an owned preset", async () => {
    presets.deleteByIdForAccount.mockResolvedValue(true);

    await expect(service.deletePreset(accountId, "preset-1")).resolves.toEqual({
      success: true,
      message: "Preset deleted",
    });
    expect(presets.deleteByIdForAccount).toHaveBeenCalledWith(accountId, "preset-1");
  });

  it("imports a valid preset JSON payload for the authenticated account", async () => {
    presets.create.mockResolvedValue(presetDocument);

    await expect(
      service.importPreset(accountId, {
        presetName: "Warm Vintage",
        enhancementSettings: {
          filter: "vintage",
        },
      }),
    ).resolves.toMatchObject({
      success: true,
      message: "Preset imported",
      preset: {
        id: "preset-1",
      },
    });
    expect(presets.create).toHaveBeenCalledWith({
      accountId,
      presetName: "Warm Vintage",
      enhancementSettings: {
        filter: "vintage",
      },
    });
  });

  it("exports an owned preset as reusable preset JSON", async () => {
    presets.findByIdForAccount.mockResolvedValue(presetDocument);

    await expect(service.exportPreset(accountId, "preset-1")).resolves.toEqual({
      presetName: "Warm Vintage",
      enhancementSettings: {
        exposure: 5,
        contrast: -5,
        filter: "vintage",
      },
    });
    expect(presets.findByIdForAccount).toHaveBeenCalledWith(accountId, "preset-1");
  });

  it("rejects invalid preset input with field-specific messages", async () => {
    await expect(service.createPreset(accountId, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.createPreset(accountId, {
        presetName: "Warm Vintage",
        enhancementSettings: [],
      }),
    ).rejects.toMatchObject({
      message: "Missing required field: enhancementSettings.",
    });
    await expect(service.updatePreset(accountId, "preset-1", {})).rejects.toMatchObject({
      message: "Missing required field: presetName or enhancementSettings.",
    });
    expect(presets.create).not.toHaveBeenCalled();
  });

  it("treats missing owned presets as not found", async () => {
    presets.updateByIdForAccount.mockResolvedValue(null);
    presets.deleteByIdForAccount.mockResolvedValue(false);
    presets.findByIdForAccount.mockResolvedValue(null);

    await expect(
      service.updatePreset(accountId, "preset-1", {
        presetName: "Warm Portrait",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.deletePreset(accountId, "preset-1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.exportPreset(accountId, "preset-1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("returns a safe conflict error for duplicate preset names", async () => {
    presets.create.mockRejectedValue({ code: 11000 });

    await expect(
      service.createPreset(accountId, {
        presetName: "Warm Vintage",
        enhancementSettings: {
          filter: "vintage",
        },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
