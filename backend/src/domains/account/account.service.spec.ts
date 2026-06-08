import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountRepository } from "../../persistence/repositories/account.repository";
import { HuggingFaceTokenEncryptionService } from "./account-token-encryption.service";
import { AccountService } from "./account.service";

describe("AccountService", () => {
  const accountId = "account-1";
  const plainToken = "hf_secret_token_123456";
  const previousTokenEncryptionKey = process.env.TOKEN_ENCRYPTION_KEY;

  let accounts: {
    saveEncryptedHuggingFaceToken: ReturnType<typeof vi.fn>;
    clearHuggingFaceToken: ReturnType<typeof vi.fn>;
  };
  let tokenEncryption: HuggingFaceTokenEncryptionService;
  let service: AccountService;

  beforeEach(() => {
    process.env.TOKEN_ENCRYPTION_KEY = "test-encryption-key";
    accounts = {
      saveEncryptedHuggingFaceToken: vi.fn(),
      clearHuggingFaceToken: vi.fn(),
    };
    tokenEncryption = new HuggingFaceTokenEncryptionService();
    service = new AccountService(accounts as unknown as AccountRepository, tokenEncryption);
  });

  afterEach(() => {
    if (previousTokenEncryptionKey === undefined) {
      delete process.env.TOKEN_ENCRYPTION_KEY;
      return;
    }

    process.env.TOKEN_ENCRYPTION_KEY = previousTokenEncryptionKey;
  });

  it("saves an encrypted Hugging Face token and returns only safe status", async () => {
    accounts.saveEncryptedHuggingFaceToken.mockResolvedValue({
      accountId,
      huggingFaceTokenConfigured: true,
    });

    const response = await service.saveHuggingFaceToken(accountId, {
      huggingFaceToken: ` ${plainToken} `,
    });
    const encryptedToken = accounts.saveEncryptedHuggingFaceToken.mock.calls[0][1] as string;

    expect(accounts.saveEncryptedHuggingFaceToken).toHaveBeenCalledWith(accountId, encryptedToken);
    expect(encryptedToken).not.toBe(plainToken);
    expect(encryptedToken).not.toContain(plainToken);
    expect(tokenEncryption.decrypt(encryptedToken)).toBe(plainToken);
    expect(response).toEqual({
      success: true,
      message: "Hugging Face token saved",
      huggingFaceTokenConfigured: true,
    });
    expect(JSON.stringify(response)).not.toContain(plainToken);
  });

  it("removes the saved token and returns disabled status", async () => {
    accounts.clearHuggingFaceToken.mockResolvedValue({
      accountId,
      huggingFaceTokenConfigured: false,
    });

    await expect(service.deleteHuggingFaceToken(accountId)).resolves.toEqual({
      success: true,
      message: "Hugging Face token removed",
      huggingFaceTokenConfigured: false,
    });
    expect(accounts.clearHuggingFaceToken).toHaveBeenCalledWith(accountId);
  });

  it("uses field-specific validation errors for token input", async () => {
    await expect(service.saveHuggingFaceToken(accountId, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.saveHuggingFaceToken(accountId, {
        huggingFaceToken: "not-a-hugging-face-token",
      }),
    ).rejects.toMatchObject({
      message: "Invalid field: huggingFaceToken must be a Hugging Face API token.",
    });
    expect(accounts.saveEncryptedHuggingFaceToken).not.toHaveBeenCalled();
  });

  it("treats missing authenticated accounts as unauthorized", async () => {
    accounts.saveEncryptedHuggingFaceToken.mockResolvedValue(null);
    accounts.clearHuggingFaceToken.mockResolvedValue(null);

    await expect(
      service.saveHuggingFaceToken(accountId, {
        huggingFaceToken: plainToken,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.deleteHuggingFaceToken(accountId)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
