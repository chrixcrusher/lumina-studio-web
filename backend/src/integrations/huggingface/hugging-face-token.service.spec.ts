import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { HuggingFaceTokenService } from "./hugging-face-token.service";

describe("HuggingFaceTokenService", () => {
  const service = new HuggingFaceTokenService();

  it("normalizes request tokens and creates authorization headers", () => {
    const token = service.requireRequestToken(" hf_secret_token_123456 ");

    expect(token).toBe("hf_secret_token_123456");
    expect(service.createAuthorizationHeader(token)).toBe("Bearer hf_secret_token_123456");
  });

  it("keeps missing and malformed token errors user-safe", () => {
    expect(() => service.requireRequestToken(undefined)).toThrow(UnauthorizedException);
    expect(() => service.requireRequestToken("not-a-token")).toThrow(BadRequestException);
    expect(() => service.optionalRequestToken(undefined)).not.toThrow();
  });
});
