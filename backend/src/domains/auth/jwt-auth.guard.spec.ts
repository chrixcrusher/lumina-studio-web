import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { AuthTokenService } from "./auth-token.service";
import { AuthenticatedRequest } from "./auth.types";
import { JwtAuthGuard } from "./jwt-auth.guard";

describe("JwtAuthGuard", () => {
  const tokenService = AuthTokenService.createForTesting("test-secret");

  it("attaches verified bearer token payload to the request", () => {
    const guard = new JwtAuthGuard(tokenService);
    const token = tokenService.sign({ id: "account-1", email: "user@example.com" });
    const request: AuthenticatedRequest = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    expect(guard.canActivate(executionContextFor(request))).toBe(true);
    expect(request.user).toMatchObject({
      accountId: "account-1",
      email: "user@example.com",
    });
  });

  it("rejects missing bearer tokens", () => {
    const guard = new JwtAuthGuard(tokenService);

    expect(() => guard.canActivate(executionContextFor({ headers: {} }))).toThrow(UnauthorizedException);
  });

  function executionContextFor(request: AuthenticatedRequest): ExecutionContext {
    return {
      switchToHttp: vi.fn(() => ({
        getRequest: () => request,
      })),
    } as unknown as ExecutionContext;
  }
});
