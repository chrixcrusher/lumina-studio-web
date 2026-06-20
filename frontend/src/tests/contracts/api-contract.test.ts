import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accountApi } from "@/domains/account/services/account-api";
import { restoreFace } from "@/domains/enhancement/services/restore-face-api";
import { authApi } from "@/domains/authentication/services/auth-api";
import { historyApi } from "@/domains/history/services/history-api";
import { presetsApi } from "@/domains/presets/services/presets-api";
import { API_AUTH_TOKEN_STORAGE_KEY } from "@/infrastructure/api/api-client";
import { OPERATION_TYPES, PROCESSING_MODES } from "@/shared/constants/lumina";
import { GUEST_SESSION_STORAGE_KEY } from "@/shared/guest-session";

describe("frontend API contract", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls the documented MVP endpoints with canonical methods", async () => {
    const fetchMock = vi.fn().mockImplementation((path: string, init?: RequestInit) => {
      return Promise.resolve(jsonResponse(responseFor(path, init?.method ?? "GET")));
    });
    vi.stubGlobal("fetch", fetchMock);
    window.localStorage.setItem(API_AUTH_TOKEN_STORAGE_KEY, "jwt-token");

    await authApi.register({
      email: "user@example.com",
      password: "SecurePassword123",
      displayName: "Christian",
    });
    await authApi.login({
      email: "user@example.com",
      password: "SecurePassword123",
    });
    await authApi.logout();
    window.localStorage.setItem(API_AUTH_TOKEN_STORAGE_KEY, "jwt-token");
    await authApi.me();
    await accountApi.saveHuggingFaceToken({ huggingFaceToken: "hf_secret_token_123456" });
    await accountApi.deleteHuggingFaceToken();
    await restoreFace({
      image: "data:image/png;base64,aW1hZ2U=",
      huggingFaceToken: "hf_guest_token_123456",
      sessionId: "guest-session-1",
      outputFormat: "jpeg",
    });
    await historyApi.list();
    await historyApi.create({
      operationType: OPERATION_TYPES.filter,
      processingMode: PROCESSING_MODES.browser,
      status: "success",
    });
    await historyApi.delete("history-1");
    await presetsApi.list();
    await presetsApi.create({
      presetName: "Warm Vintage",
      enhancementSettings: { exposure: 5 },
    });
    await presetsApi.update("preset-1", {
      presetName: "Warm Vintage",
      enhancementSettings: { exposure: 8 },
    });
    await presetsApi.delete("preset-1");
    await presetsApi.import({
      presetName: "Warm Vintage",
      enhancementSettings: { exposure: 5 },
    });
    await presetsApi.export("preset-1");

    expect(calledContracts(fetchMock)).toEqual([
      "POST /api/v1/auth/register",
      "POST /api/v1/auth/login",
      "POST /api/v1/auth/logout",
      "GET /api/v1/auth/me",
      "PUT /api/v1/account/hugging-face-token",
      "DELETE /api/v1/account/hugging-face-token",
      "POST /api/v1/ai/restore-face",
      "GET /api/v1/history",
      "POST /api/v1/history",
      "DELETE /api/v1/history/history-1",
      "GET /api/v1/presets",
      "POST /api/v1/presets",
      "PUT /api/v1/presets/preset-1",
      "DELETE /api/v1/presets/preset-1",
      "POST /api/v1/presets/import",
      "GET /api/v1/presets/preset-1/export",
    ]);
  });

  it("uses guest session ownership for unauthenticated history without leaking Hugging Face tokens in responses", async () => {
    window.sessionStorage.setItem(GUEST_SESSION_STORAGE_KEY, "guest-session-1");
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        success: true,
        history: [],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await historyApi.list();

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect((request.headers as Headers).get("x-session-id")).toBe("guest-session-1");
    expect(JSON.stringify(await responseFor("/api/v1/account/hugging-face-token", "PUT"))).not.toContain("hf_");
  });
});

function calledContracts(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.map(([path, init]) => `${(init as RequestInit | undefined)?.method ?? "GET"} ${apiPath(String(path))}`);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function responseFor(path: string, method: string): unknown {
  path = apiPath(path);

  if (path === "/api/v1/auth/register" || path === "/api/v1/auth/login") {
    return {
      success: true,
      message: "Authentication successful",
      account: account(),
      token: "jwt-token",
    };
  }

  if (path === "/api/v1/auth/logout") {
    return {
      success: true,
      message: "Logged out successfully",
    };
  }

  if (path === "/api/v1/auth/me") {
    return {
      success: true,
      account: {
        ...account(),
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    };
  }

  if (path === "/api/v1/account/hugging-face-token") {
    return {
      success: true,
      message: method === "DELETE" ? "Hugging Face token removed" : "Hugging Face token saved",
      huggingFaceTokenConfigured: method !== "DELETE",
    };
  }

  if (path === "/api/v1/ai/restore-face") {
    return {
      success: true,
      message: "Face restored successfully",
      restoredImage: "cmVzdG9yZWQ=",
      historyId: "history-1",
      operationType: OPERATION_TYPES.restoreFace,
      processingMode: PROCESSING_MODES.cloudAi,
      settingsUsed: { model: "CodeFormer" },
      outputFormat: "jpeg",
      processingTimeMs: 1200,
    };
  }

  if (path === "/api/v1/history" && method === "GET") {
    return {
      success: true,
      history: [],
    };
  }

  if (path === "/api/v1/history" && method === "POST") {
    return {
      success: true,
      message: "History metadata saved",
      historyId: "history-1",
    };
  }

  if (path === "/api/v1/history/history-1") {
    return {
      success: true,
      message: "History metadata deleted",
    };
  }

  if (path === "/api/v1/presets") {
    return method === "GET"
      ? {
          success: true,
          presets: [preset()],
        }
      : {
          success: true,
          message: "Preset created",
          preset: preset(),
        };
  }

  if (path === "/api/v1/presets/preset-1" && method === "PUT") {
    return {
      success: true,
      message: "Preset updated",
      preset: preset(),
    };
  }

  if (path === "/api/v1/presets/preset-1" && method === "DELETE") {
    return {
      success: true,
      message: "Preset deleted",
    };
  }

  if (path === "/api/v1/presets/import") {
    return {
      success: true,
      message: "Preset imported",
      preset: preset(),
    };
  }

  if (path === "/api/v1/presets/preset-1/export") {
    return {
      presetName: "Warm Vintage",
      enhancementSettings: { exposure: 5 },
    };
  }

  throw new Error(`Missing mocked API contract response for ${method} ${path}`);
}

function apiPath(path: string): string {
  try {
    return new URL(path).pathname;
  } catch {
    return path;
  }
}

function account() {
  return {
    id: "account-1",
    email: "user@example.com",
    displayName: "Christian",
    huggingFaceTokenConfigured: false,
  };
}

function preset() {
  return {
    id: "preset-1",
    presetName: "Warm Vintage",
    enhancementSettings: { exposure: 5 },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}
