import { UnauthorizedException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OPERATION_TYPES, PROCESSING_MODES } from "../../contracts/lumina";
import { AuthTokenService } from "../auth/auth-token.service";
import { HistoryController } from "./history.controller";
import { HistoryService } from "./history.service";

describe("HistoryController", () => {
  let history: {
    listHistory: ReturnType<typeof vi.fn>;
    createHistory: ReturnType<typeof vi.fn>;
    deleteHistory: ReturnType<typeof vi.fn>;
  };
  let tokens: {
    verify: ReturnType<typeof vi.fn>;
  };
  let controller: HistoryController;

  beforeEach(() => {
    history = {
      listHistory: vi.fn(),
      createHistory: vi.fn(),
      deleteHistory: vi.fn(),
    };
    tokens = {
      verify: vi.fn().mockReturnValue({
        accountId: "account-1",
        email: "user@example.com",
        exp: 1780000000,
      }),
    };
    controller = new HistoryController(
      history as unknown as HistoryService,
      tokens as unknown as AuthTokenService,
    );
  });

  it("uses authenticated account ownership when a bearer token is present", async () => {
    history.listHistory.mockResolvedValue({
      success: true,
      history: [],
    });

    await expect(
      controller.listHistory(
        {
          headers: {
            authorization: "Bearer jwt-token",
          },
        },
        undefined,
        {
          limit: "10",
        },
      ),
    ).resolves.toEqual({
      success: true,
      history: [],
    });
    expect(tokens.verify).toHaveBeenCalledWith("jwt-token");
    expect(history.listHistory).toHaveBeenCalledWith(
      {
        accountId: "account-1",
      },
      {
        limit: "10",
      },
    );
  });

  it("uses guest session ownership when no bearer token is present", async () => {
    history.createHistory.mockResolvedValue({
      success: true,
      message: "History metadata saved",
      historyId: "history-1",
    });

    await expect(
      controller.createHistory(
        {
          headers: {},
        },
        "guest-session-1",
        {
          operationType: OPERATION_TYPES.filter,
          processingMode: PROCESSING_MODES.browser,
          status: "success",
        },
      ),
    ).resolves.toMatchObject({
      historyId: "history-1",
    });
    expect(history.createHistory).toHaveBeenCalledWith(
      {
        sessionId: "guest-session-1",
      },
      {
        operationType: OPERATION_TYPES.filter,
        processingMode: PROCESSING_MODES.browser,
        status: "success",
      },
    );
  });

  it("passes delete requests through the resolved owner", async () => {
    history.deleteHistory.mockResolvedValue({
      success: true,
      message: "History metadata deleted",
    });

    await expect(
      controller.deleteHistory(
        {
          headers: {},
        },
        "guest-session-1",
        "history-1",
      ),
    ).resolves.toEqual({
      success: true,
      message: "History metadata deleted",
    });
    expect(history.deleteHistory).toHaveBeenCalledWith(
      {
        sessionId: "guest-session-1",
      },
      "history-1",
    );
  });

  it("lets invalid bearer tokens fail safely", () => {
    tokens.verify.mockImplementation(() => {
      throw new UnauthorizedException("Authorization bearer token is invalid.");
    });

    expect(() =>
      controller.listHistory(
        {
          headers: {
            authorization: "Bearer bad-token",
          },
        },
        "guest-session-1",
        {},
      ),
    ).toThrow(UnauthorizedException);
  });
});
