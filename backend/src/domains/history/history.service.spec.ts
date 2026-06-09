import { BadRequestException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OPERATION_TYPES, PROCESSING_MODES } from "../../contracts/lumina";
import {
  HISTORY_STATUSES,
  HistoryDocument,
} from "../../persistence/mongodb/schemas/history.schema";
import { HistoryRepository } from "../../persistence/repositories/history.repository";
import { HistoryService } from "./history.service";

describe("HistoryService", () => {
  const createdAt = new Date("2026-01-01T00:00:00.000Z");
  const historyDocument = {
    id: "history-1",
    accountId: "account-1",
    operationType: OPERATION_TYPES.restoreFace,
    processingMode: PROCESSING_MODES.cloudAi,
    settingsUsed: {
      model: "CodeFormer",
    },
    outputFormat: "image/png",
    processingTimeMs: 120,
    status: HISTORY_STATUSES.success,
    originalImageUrl: null,
    enhancedImageUrl: null,
    createdAt,
  } as unknown as HistoryDocument;

  let history: {
    create: ReturnType<typeof vi.fn>;
    findByAccountId: ReturnType<typeof vi.fn>;
    findBySessionId: ReturnType<typeof vi.fn>;
    deleteByIdForAccount: ReturnType<typeof vi.fn>;
    deleteByIdForSession: ReturnType<typeof vi.fn>;
  };
  let service: HistoryService;

  beforeEach(() => {
    history = {
      create: vi.fn(),
      findByAccountId: vi.fn(),
      findBySessionId: vi.fn(),
      deleteByIdForAccount: vi.fn(),
      deleteByIdForSession: vi.fn(),
    };
    service = new HistoryService(history as unknown as HistoryRepository);
  });

  it("lists authenticated metadata history with optional filters", async () => {
    history.findByAccountId.mockResolvedValue([historyDocument]);

    await expect(
      service.listHistory(
        { accountId: "account-1" },
        {
          operationType: OPERATION_TYPES.restoreFace,
          processingMode: PROCESSING_MODES.cloudAi,
          limit: "1",
        },
      ),
    ).resolves.toEqual({
      success: true,
      history: [
        {
          id: "history-1",
          operationType: OPERATION_TYPES.restoreFace,
          processingMode: PROCESSING_MODES.cloudAi,
          settingsUsed: {
            model: "CodeFormer",
          },
          outputFormat: "image/png",
          processingTimeMs: 120,
          status: HISTORY_STATUSES.success,
          originalImageUrl: null,
          enhancedImageUrl: null,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    expect(history.findByAccountId).toHaveBeenCalledWith("account-1");
  });

  it("creates guest metadata-only history records", async () => {
    history.create.mockResolvedValue(historyDocument);

    await expect(
      service.createHistory(
        { sessionId: "guest-session-1" },
        {
          operationType: OPERATION_TYPES.adjust,
          processingMode: PROCESSING_MODES.browser,
          settingsUsed: {
            brightness: 12,
          },
          status: HISTORY_STATUSES.success,
        },
      ),
    ).resolves.toEqual({
      success: true,
      message: "History metadata saved",
      historyId: "history-1",
    });
    expect(history.create).toHaveBeenCalledWith({
      accountId: undefined,
      sessionId: "guest-session-1",
      operationType: OPERATION_TYPES.adjust,
      processingMode: PROCESSING_MODES.browser,
      settingsUsed: {
        brightness: 12,
      },
      outputFormat: undefined,
      processingTimeMs: undefined,
      status: HISTORY_STATUSES.success,
      errorCode: undefined,
    });
  });

  it("deletes only owned account or guest records", async () => {
    history.deleteByIdForAccount.mockResolvedValue(true);
    history.deleteByIdForSession.mockResolvedValue(true);

    await expect(service.deleteHistory({ accountId: "account-1" }, "history-1")).resolves.toEqual({
      success: true,
      message: "History metadata deleted",
    });
    await expect(service.deleteHistory({ sessionId: "guest-session-1" }, "history-2")).resolves.toEqual({
      success: true,
      message: "History metadata deleted",
    });
    expect(history.deleteByIdForAccount).toHaveBeenCalledWith("account-1", "history-1");
    expect(history.deleteByIdForSession).toHaveBeenCalledWith("guest-session-1", "history-2");
  });

  it("rejects missing ownership and invalid canonical fields", async () => {
    await expect(service.listHistory({})).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      service.createHistory(
        { accountId: "account-1" },
        {
          operationType: "manual",
          processingMode: PROCESSING_MODES.browser,
          status: HISTORY_STATUSES.success,
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(history.create).not.toHaveBeenCalled();
  });

  it("treats missing owned history as not found", async () => {
    history.deleteByIdForAccount.mockResolvedValue(false);

    await expect(service.deleteHistory({ accountId: "account-1" }, "history-1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
