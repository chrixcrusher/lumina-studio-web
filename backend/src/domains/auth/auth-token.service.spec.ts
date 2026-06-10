import { UnauthorizedException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { AuthTokenService } from "./auth-token.service";

describe("AuthTokenService", () => {
  it("signs and verifies JWT bearer tokens", () => {
    const service = AuthTokenService.createForTesting("test-secret");
    const token = service.sign({ id: "account-1", email: "user@example.com" });

    expect(token.split(".")).toHaveLength(3);
    expect(service.verify(token)).toEqual({
      accountId: "account-1",
      email: "user@example.com",
      exp: expect.any(Number),
    });
  });

  it("rejects tampered and expired tokens", () => {
    const service = AuthTokenService.createForTesting("test-secret");
    const expiredService = AuthTokenService.createForTesting("test-secret", -1);
    const token = service.sign({ id: "account-1", email: "user@example.com" });
    const tamperedToken = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;

    expect(() => service.verify(tamperedToken)).toThrow(UnauthorizedException);
    expect(() => expiredService.verify(expiredService.sign({ id: "account-1", email: "user@example.com" }))).toThrow(
      UnauthorizedException,
    );
  });
});
