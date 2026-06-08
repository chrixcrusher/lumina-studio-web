import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_AUTH_TOKEN_STORAGE_KEY, ApiError } from "@/infrastructure/api/api-client";
import { authApi } from "./auth-api";

describe("authApi", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores the JWT token returned from register and sends it on authenticated requests", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          message: "Account registered successfully",
          account: {
            id: "account-1",
            email: "user@example.com",
            displayName: "Christian",
            huggingFaceTokenConfigured: false,
          },
          token: "jwt-token",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          account: {
            id: "account-1",
            email: "user@example.com",
            displayName: "Christian",
            huggingFaceTokenConfigured: false,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-02T00:00:00.000Z",
          },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await authApi.register({
      email: "user@example.com",
      password: "SecurePassword123",
      displayName: "Christian",
    });
    await authApi.me();

    const authenticatedRequest = fetchMock.mock.calls[1][1] as RequestInit;
    const headers = authenticatedRequest.headers as Headers;

    expect(window.localStorage.getItem(API_AUTH_TOKEN_STORAGE_KEY)).toBe("jwt-token");
    expect(headers.get("Authorization")).toBe("Bearer jwt-token");
  });

  it("clears the stored JWT on logout even when the backend rejects the request", async () => {
    window.localStorage.setItem(API_AUTH_TOKEN_STORAGE_KEY, "expired-token");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            success: false,
            error: "Unauthorized",
            details: "Authorization bearer token has expired.",
          },
          401,
        ),
      ),
    );

    await expect(authApi.logout()).rejects.toBeInstanceOf(ApiError);
    expect(window.localStorage.getItem(API_AUTH_TOKEN_STORAGE_KEY)).toBeNull();
  });

  function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
});
