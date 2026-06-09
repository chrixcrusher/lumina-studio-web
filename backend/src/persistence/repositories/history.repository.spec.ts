import { Model } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OPERATION_TYPES, PROCESSING_MODES } from "../../contracts/lumina";
import { HistoryDocument } from "../mongodb/schemas/history.schema";
import { HistoryRepository } from "./history.repository";

type MockQuery = {
  sort: ReturnType<typeof vi.fn>;
  exec: ReturnType<typeof vi.fn>;
};

const createQuery = <T>(value: T): MockQuery => ({
  sort: vi.fn().mockReturnThis(),
  exec: vi.fn().mockResolvedValue(value),
});

describe("HistoryRepository", () => {
  const historyDocument = {
    id: "history-1",
    accountId: "account-1",
    originalImageUrl: null,
    enhancedImageUrl: null,
    operationType: OPERATION_TYPES.filter,
    processingMode: PROCESSING_MODES.browser,
    settingsUsed: {
      filter: "vintage",
    },
    status: "success",
  } as unknown as HistoryDocument;

  let historyModel: {
    create: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    deleteOne: ReturnType<typeof vi.fn>;
  };
  let repository: HistoryRepository;

  beforeEach(() => {
    historyModel = {
      create: vi.fn(),
      find: vi.fn(),
      deleteOne: vi.fn(),
    };

    repository = new HistoryRepository(historyModel as unknown as Model<HistoryDocument>);
  });

  it("creates authenticated metadata-only history records", async () => {
    historyModel.create.mockResolvedValue(historyDocument);

    await expect(
      repository.create({
        accountId: "account-1",
        operationType: OPERATION_TYPES.restoreFace,
        processingMode: PROCESSING_MODES.cloudAi,
        settingsUsed: {
          model: "CodeFormer",
          fidelity: 0.7,
        },
        outputFormat: "jpeg",
        processingTimeMs: 4200,
        status: "success",
      }),
    ).resolves.toBe(historyDocument);

    expect(historyModel.create).toHaveBeenCalledWith({
      accountId: "account-1",
      sessionId: undefined,
      originalImageUrl: null,
      enhancedImageUrl: null,
      operationType: OPERATION_TYPES.restoreFace,
      processingMode: PROCESSING_MODES.cloudAi,
      settingsUsed: {
        model: "CodeFormer",
        fidelity: 0.7,
      },
      outputFormat: "jpeg",
      processingTimeMs: 4200,
      status: "success",
      errorCode: undefined,
    });
  });

  it("creates guest history records with session ownership", async () => {
    historyModel.create.mockResolvedValue(historyDocument);

    await expect(
      repository.create({
        sessionId: "guest-session-1",
        operationType: OPERATION_TYPES.textOverlay,
        processingMode: PROCESSING_MODES.browser,
        settingsUsed: {
          text: "Portrait",
        },
        status: "failed",
        errorCode: "TEXT_LAYER_INVALID",
      }),
    ).resolves.toBe(historyDocument);

    expect(historyModel.create).toHaveBeenCalledWith({
      accountId: undefined,
      sessionId: "guest-session-1",
      originalImageUrl: null,
      enhancedImageUrl: null,
      operationType: OPERATION_TYPES.textOverlay,
      processingMode: PROCESSING_MODES.browser,
      settingsUsed: {
        text: "Portrait",
      },
      outputFormat: undefined,
      processingTimeMs: undefined,
      status: "failed",
      errorCode: "TEXT_LAYER_INVALID",
    });
  });

  it("lists only history owned by an account", async () => {
    const query = createQuery([historyDocument]);
    historyModel.find.mockReturnValue(query);

    await expect(repository.findByAccountId("account-1")).resolves.toEqual([historyDocument]);

    expect(historyModel.find).toHaveBeenCalledWith({ accountId: "account-1" });
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it("lists only history owned by a guest session", async () => {
    const query = createQuery([historyDocument]);
    historyModel.find.mockReturnValue(query);

    await expect(repository.findBySessionId("guest-session-1")).resolves.toEqual([historyDocument]);

    expect(historyModel.find).toHaveBeenCalledWith({ sessionId: "guest-session-1" });
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it("deletes a history record by id only when it belongs to the account", async () => {
    const query = createQuery({ deletedCount: 1 });
    historyModel.deleteOne.mockReturnValue(query);

    await expect(repository.deleteByIdForAccount("account-1", "history-1")).resolves.toBe(true);

    expect(historyModel.deleteOne).toHaveBeenCalledWith({ _id: "history-1", accountId: "account-1" });
  });

  it("deletes a history record by id only when it belongs to the guest session", async () => {
    const query = createQuery({ deletedCount: 1 });
    historyModel.deleteOne.mockReturnValue(query);

    await expect(repository.deleteByIdForSession("guest-session-1", "history-1")).resolves.toBe(true);

    expect(historyModel.deleteOne).toHaveBeenCalledWith({
      _id: "history-1",
      sessionId: "guest-session-1",
    });
  });

  it("reports false when no owned history record is deleted", async () => {
    const query = createQuery({ deletedCount: 0 });
    historyModel.deleteOne.mockReturnValue(query);

    await expect(repository.deleteByIdForAccount("account-1", "history-1")).resolves.toBe(false);
  });
});
