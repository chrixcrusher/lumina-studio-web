import { UnauthorizedException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountController } from "./account.controller";
import { AccountService } from "./account.service";

describe("AccountController", () => {
  const authenticatedRequest = {
    headers: {},
    user: {
      accountId: "account-1",
      email: "user@example.com",
      exp: 1780000000,
    },
  };
  const statusResponse = {
    success: true,
    message: "Hugging Face token saved",
    huggingFaceTokenConfigured: true,
  };

  let account: {
    saveHuggingFaceToken: ReturnType<typeof vi.fn>;
    deleteHuggingFaceToken: ReturnType<typeof vi.fn>;
  };
  let controller: AccountController;

  beforeEach(() => {
    account = {
      saveHuggingFaceToken: vi.fn(),
      deleteHuggingFaceToken: vi.fn(),
    };
    controller = new AccountController(account as unknown as AccountService);
  });

  it("saves the authenticated user's Hugging Face token", async () => {
    account.saveHuggingFaceToken.mockResolvedValue(statusResponse);

    await expect(
      controller.saveHuggingFaceToken(authenticatedRequest, {
        huggingFaceToken: "hf_secret_token_123456",
      }),
    ).resolves.toBe(statusResponse);
    expect(account.saveHuggingFaceToken).toHaveBeenCalledWith("account-1", {
      huggingFaceToken: "hf_secret_token_123456",
    });
  });

  it("deletes the authenticated user's Hugging Face token", async () => {
    account.deleteHuggingFaceToken.mockResolvedValue({
      ...statusResponse,
      message: "Hugging Face token removed",
      huggingFaceTokenConfigured: false,
    });

    await expect(controller.deleteHuggingFaceToken(authenticatedRequest)).resolves.toMatchObject({
      success: true,
      huggingFaceTokenConfigured: false,
    });
    expect(account.deleteHuggingFaceToken).toHaveBeenCalledWith("account-1");
  });

  it("rejects requests without authenticated request state", async () => {
    expect(() =>
      controller.saveHuggingFaceToken(
        {
          headers: {},
        },
        {
          huggingFaceToken: "hf_secret_token_123456",
        },
      ),
    ).toThrow(UnauthorizedException);
    expect(() =>
      controller.deleteHuggingFaceToken({
        headers: {},
      }),
    ).toThrow(UnauthorizedException);
  });
});
