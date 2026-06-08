import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_AUTH_TOKEN_STORAGE_KEY } from "@/infrastructure/api/api-client";
import { accountApi } from "./account-api";

describe("accountApi", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(API_AUTH_TOKEN_STORAGE_KEY, "jwt-token");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves and deletes Hugging Face tokens while exposing only configured status", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          message: "Hugging Face token saved",
          huggingFaceTokenConfigured: true,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          message: "Hugging Face token removed",
          huggingFaceTokenConfigured: false,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const saveResponse = await accountApi.saveHuggingFaceToken({
      huggingFaceToken: "hf_secret_token_123456",
    });
    const deleteResponse = await accountApi.deleteHuggingFaceToken();
    const saveRequest = fetchMock.mock.calls[0][1] as RequestInit;
    const deleteRequest = fetchMock.mock.calls[1][1] as RequestInit;

    expect(saveResponse).toEqual({
      success: true,
      message: "Hugging Face token saved",
      huggingFaceTokenConfigured: true,
    });
    expect(deleteResponse.huggingFaceTokenConfigured).toBe(false);
    expect(JSON.stringify(saveResponse)).not.toContain("hf_secret_token_123456");
    expect((saveRequest.headers as Headers).get("Authorization")).toBe("Bearer jwt-token");
    expect(saveRequest.method).toBe("PUT");
    expect(saveRequest.body).toBe(
      JSON.stringify({
        huggingFaceToken: "hf_secret_token_123456",
      }),
    );
    expect(deleteRequest.method).toBe("DELETE");
    expect(deleteRequest.body).toBeUndefined();
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
