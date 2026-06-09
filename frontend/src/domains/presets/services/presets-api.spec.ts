import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_AUTH_TOKEN_STORAGE_KEY } from "@/infrastructure/api/api-client";
import { presetsApi } from "./presets-api";

describe("presetsApi", () => {
  const preset = {
    id: "preset-1",
    presetName: "Warm Vintage",
    enhancementSettings: {
      exposure: 5,
      filter: "vintage",
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(API_AUTH_TOKEN_STORAGE_KEY, "jwt-token");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("unwraps preset list and mutation responses while sending auth", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          presets: [preset],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          message: "Preset created",
          preset,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          message: "Preset deleted",
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(presetsApi.list()).resolves.toEqual([preset]);
    await expect(
      presetsApi.create({
        presetName: "Warm Vintage",
        enhancementSettings: {
          exposure: 5,
          filter: "vintage",
        },
      }),
    ).resolves.toEqual(preset);
    await expect(presetsApi.delete("preset-1")).resolves.toBeUndefined();

    const listRequest = fetchMock.mock.calls[0][1] as RequestInit;
    const createRequest = fetchMock.mock.calls[1][1] as RequestInit;
    const deleteRequest = fetchMock.mock.calls[2][1] as RequestInit;

    expect((listRequest.headers as Headers).get("Authorization")).toBe("Bearer jwt-token");
    expect(createRequest.method).toBe("POST");
    expect(createRequest.body).toBe(
      JSON.stringify({
        presetName: "Warm Vintage",
        enhancementSettings: {
          exposure: 5,
          filter: "vintage",
        },
      }),
    );
    expect(deleteRequest.method).toBe("DELETE");
  });

  it("exports reusable preset JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          presetName: "Warm Vintage",
          enhancementSettings: {
            exposure: 5,
          },
        }),
      ),
    );

    await expect(presetsApi.export("preset-1")).resolves.toEqual({
      presetName: "Warm Vintage",
      enhancementSettings: {
        exposure: 5,
      },
    });
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
