import { UnauthorizedException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import type { CurrentUserResponseDto } from "./auth.types";

describe("AuthController", () => {
  let auth: {
    register: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    getCurrentUser: ReturnType<typeof vi.fn>;
  };
  let controller: AuthController;

  beforeEach(() => {
    auth = {
      register: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      getCurrentUser: vi.fn(),
    };
    controller = new AuthController(auth as unknown as AuthService);
  });

  it("delegates register and login endpoint bodies to the auth service", async () => {
    const authResponse = {
      success: true,
      message: "Authentication successful",
      account: {
        id: "account-1",
        email: "user@example.com",
        displayName: "Christian",
        huggingFaceTokenConfigured: false,
      },
      token: "jwt-token",
    };

    auth.register.mockResolvedValue(authResponse);
    auth.login.mockResolvedValue(authResponse);

    await expect(
      controller.register({
        email: "user@example.com",
        password: "SecurePassword123",
        displayName: "Christian",
      }),
    ).resolves.toBe(authResponse);
    await expect(
      controller.login({
        email: "user@example.com",
        password: "SecurePassword123",
      }),
    ).resolves.toBe(authResponse);
  });

  it("returns the logout response from the protected endpoint", () => {
    const response = { success: true, message: "Logged out successfully" };
    auth.logout.mockReturnValue(response);

    expect(controller.logout()).toBe(response);
  });

  it("loads the current user from authenticated request state", async () => {
    const response: CurrentUserResponseDto = {
      success: true,
      account: {
        id: "account-1",
        email: "user@example.com",
        displayName: "Christian",
        huggingFaceTokenConfigured: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    };
    auth.getCurrentUser.mockResolvedValue(response);

    await expect(
      controller.me({
        headers: {},
        user: {
          accountId: "account-1",
          email: "user@example.com",
          exp: 1780000000,
        },
      }),
    ).resolves.toBe(response);
    expect(auth.getCurrentUser).toHaveBeenCalledWith("account-1");
  });

  it("rejects me requests without authenticated request state", async () => {
    expect(() => controller.me({ headers: {} })).toThrow(UnauthorizedException);
  });
});
