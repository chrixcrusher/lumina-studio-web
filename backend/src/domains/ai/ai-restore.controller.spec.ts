import { UnauthorizedException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthTokenService } from "../auth/auth-token.service";
import { AiRestoreController } from "./ai-restore.controller";
import { AiRestoreService } from "./ai-restore.service";

describe("AiRestoreController", () => {
  let restore: {
    restoreFace: ReturnType<typeof vi.fn>;
  };
  let tokens: {
    verify: ReturnType<typeof vi.fn>;
  };
  let controller: AiRestoreController;

  beforeEach(() => {
    restore = {
      restoreFace: vi.fn().mockResolvedValue({
        success: true,
        message: "Face restored successfully",
        restoredImage: "cmVzdG9yZWQ=",
        historyId: "history-1",
        operationType: "restore_face",
        processingMode: "cloud_ai",
        settingsUsed: {
          model: "CodeFormer",
        },
        outputFormat: "jpeg",
        processingTimeMs: 25,
      }),
    };
    tokens = {
      verify: vi.fn().mockReturnValue({
        accountId: "account-1",
        email: "user@example.com",
        exp: 1780000000,
      }),
    };
    controller = new AiRestoreController(
      restore as unknown as AiRestoreService,
      tokens as unknown as AuthTokenService,
    );
  });

  it("uses authenticated account ownership when a bearer token is present", async () => {
    const body = {
      image: "aW1hZ2U=",
      useSavedToken: true,
    };

    await controller.restoreFace(
      {
        headers: {
          authorization: "Bearer jwt-token",
        },
      },
      "guest-session-1",
      body,
    );

    expect(tokens.verify).toHaveBeenCalledWith("jwt-token");
    expect(restore.restoreFace).toHaveBeenCalledWith(
      {
        accountId: "account-1",
      },
      body,
    );
  });

  it("uses guest session ownership when no bearer token is present", async () => {
    const body = {
      image: "aW1hZ2U=",
      huggingFaceToken: "hf_guest_token_123456",
    };

    await controller.restoreFace(
      {
        headers: {},
      },
      "guest-session-1",
      body,
    );

    expect(restore.restoreFace).toHaveBeenCalledWith(
      {
        sessionId: "guest-session-1",
      },
      body,
    );
  });

  it("lets invalid bearer tokens fail safely", () => {
    tokens.verify.mockImplementation(() => {
      throw new UnauthorizedException("Authorization bearer token is invalid.");
    });

    expect(() =>
      controller.restoreFace(
        {
          headers: {
            authorization: "Bearer bad-token",
          },
        },
        "guest-session-1",
        {
          image: "aW1hZ2U=",
        },
      ),
    ).toThrow(UnauthorizedException);
  });
});
