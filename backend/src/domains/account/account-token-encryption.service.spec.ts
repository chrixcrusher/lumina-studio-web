import { InternalServerErrorException } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HuggingFaceTokenEncryptionService } from "./account-token-encryption.service";

describe("HuggingFaceTokenEncryptionService", () => {
  const plainToken = "hf_secret_token_123456";
  const previousTokenEncryptionKey = process.env.TOKEN_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.TOKEN_ENCRYPTION_KEY = "test-encryption-key";
  });

  afterEach(() => {
    if (previousTokenEncryptionKey === undefined) {
      delete process.env.TOKEN_ENCRYPTION_KEY;
      return;
    }

    process.env.TOKEN_ENCRYPTION_KEY = previousTokenEncryptionKey;
  });

  it("encrypts Hugging Face tokens without embedding the plain token", () => {
    const service = new HuggingFaceTokenEncryptionService();

    const encryptedToken = service.encrypt(plainToken);

    expect(encryptedToken).not.toBe(plainToken);
    expect(encryptedToken).not.toContain(plainToken);
    expect(service.decrypt(encryptedToken)).toBe(plainToken);
  });

  it("uses a fresh initialization vector for each encryption", () => {
    const service = new HuggingFaceTokenEncryptionService();

    expect(service.encrypt(plainToken)).not.toBe(service.encrypt(plainToken));
  });

  it("rejects malformed encrypted token payloads with a safe error", () => {
    const service = new HuggingFaceTokenEncryptionService();

    expect(() => service.decrypt("not-an-encrypted-token")).toThrow(InternalServerErrorException);
  });
});
