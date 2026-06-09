import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_AUTH_TOKEN_STORAGE_KEY } from "@/infrastructure/api/api-client";
import { OPERATION_TYPES, PROCESSING_MODES } from "@/shared/constants/lumina";
import { GUEST_SESSION_STORAGE_KEY } from "@/shared/guest-session";
import { historyApi } from "./history-api";

describe("historyApi", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists history records with guest session ownership", async () => {
    window.sessionStorage.setItem(GUEST_SESSION_STORAGE_KEY, "guest-session-1");
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        success: true,
        history: [
          {
            id: "history-1",
            operationType: OPERATION_TYPES.restoreFace,
            processingMode: PROCESSING_MODES.cloudAi,
            settingsUsed: {
              model: "CodeFormer",
            },
            status: "success",
            originalImageUrl: null,
            enhancedImageUrl: null,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(historyApi.list()).resolves.toHaveLength(1);

    const listRequest = fetchMock.mock.calls[0][1] as RequestInit;
    expect((listRequest.headers as Headers).get("x-session-id")).toBe("guest-session-1");
  });

  it("creates and deletes history using bearer auth when configured", async () => {
    window.localStorage.setItem(API_AUTH_TOKEN_STORAGE_KEY, "jwt-token");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          {
            success: true,
            message: "History metadata saved",
            historyId: "history-1",
          },
          201,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          message: "History metadata deleted",
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      historyApi.create({
        operationType: OPERATION_TYPES.adjust,
        processingMode: PROCESSING_MODES.browser,
        status: "success",
      }),
    ).resolves.toMatchObject({
      historyId: "history-1",
    });
    await expect(historyApi.delete("history-1")).resolves.toBeUndefined();

    const createRequest = fetchMock.mock.calls[0][1] as RequestInit;
    const deleteRequest = fetchMock.mock.calls[1][1] as RequestInit;

    expect((createRequest.headers as Headers).get("Authorization")).toBe("Bearer jwt-token");
    expect((deleteRequest.headers as Headers).get("Authorization")).toBe("Bearer jwt-token");
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
