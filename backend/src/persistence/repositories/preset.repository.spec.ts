import { Model } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PresetDocument } from "../mongodb/schemas/preset.schema";
import { PresetRepository } from "./preset.repository";

type MockQuery = {
  sort: ReturnType<typeof vi.fn>;
  exec: ReturnType<typeof vi.fn>;
};

const createQuery = <T>(value: T): MockQuery => ({
  sort: vi.fn().mockReturnThis(),
  exec: vi.fn().mockResolvedValue(value),
});

describe("PresetRepository", () => {
  const presetDocument = {
    id: "preset-1",
    accountId: "account-1",
    presetName: "Warm Vintage",
    enhancementSettings: {
      exposure: 5,
      contrast: -5,
      filter: "vintage",
    },
  } as unknown as PresetDocument;

  let presetModel: {
    create: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    findOneAndUpdate: ReturnType<typeof vi.fn>;
    deleteOne: ReturnType<typeof vi.fn>;
  };
  let repository: PresetRepository;

  beforeEach(() => {
    presetModel = {
      create: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      deleteOne: vi.fn(),
    };

    repository = new PresetRepository(presetModel as unknown as Model<PresetDocument>);
  });

  it("creates presets with account ownership and object settings", async () => {
    presetModel.create.mockResolvedValue(presetDocument);

    await expect(
      repository.create({
        accountId: "account-1",
        presetName: "Warm Vintage",
        enhancementSettings: {
          exposure: 5,
          contrast: -5,
          filter: "vintage",
        },
      }),
    ).resolves.toBe(presetDocument);

    expect(presetModel.create).toHaveBeenCalledWith({
      accountId: "account-1",
      presetName: "Warm Vintage",
      enhancementSettings: {
        exposure: 5,
        contrast: -5,
        filter: "vintage",
      },
    });
  });

  it("lists only presets owned by the account", async () => {
    const query = createQuery([presetDocument]);
    presetModel.find.mockReturnValue(query);

    await expect(repository.findByAccountId("account-1")).resolves.toEqual([presetDocument]);

    expect(presetModel.find).toHaveBeenCalledWith({ accountId: "account-1" });
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it("finds a preset by id only when it belongs to the account", async () => {
    const query = createQuery(presetDocument);
    presetModel.findOne.mockReturnValue(query);

    await expect(repository.findByIdForAccount("account-1", "preset-1")).resolves.toBe(presetDocument);

    expect(presetModel.findOne).toHaveBeenCalledWith({ _id: "preset-1", accountId: "account-1" });
  });

  it("updates a preset by id only when it belongs to the account", async () => {
    const query = createQuery(presetDocument);
    presetModel.findOneAndUpdate.mockReturnValue(query);

    await expect(
      repository.updateByIdForAccount("account-1", "preset-1", {
        presetName: "Cool Portrait",
        enhancementSettings: {
          saturation: -5,
          filter: "cool",
        },
      }),
    ).resolves.toBe(presetDocument);

    expect(presetModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: "preset-1", accountId: "account-1" },
      {
        $set: {
          presetName: "Cool Portrait",
          enhancementSettings: {
            saturation: -5,
            filter: "cool",
          },
        },
      },
      { new: true, runValidators: true },
    );
  });

  it("falls back to an owned lookup when there are no update fields", async () => {
    const query = createQuery(presetDocument);
    presetModel.findOne.mockReturnValue(query);

    await expect(repository.updateByIdForAccount("account-1", "preset-1", {})).resolves.toBe(presetDocument);

    expect(presetModel.findOne).toHaveBeenCalledWith({ _id: "preset-1", accountId: "account-1" });
    expect(presetModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("deletes a preset by id only when it belongs to the account", async () => {
    const query = createQuery({ deletedCount: 1 });
    presetModel.deleteOne.mockReturnValue(query);

    await expect(repository.deleteByIdForAccount("account-1", "preset-1")).resolves.toBe(true);

    expect(presetModel.deleteOne).toHaveBeenCalledWith({ _id: "preset-1", accountId: "account-1" });
  });
});
