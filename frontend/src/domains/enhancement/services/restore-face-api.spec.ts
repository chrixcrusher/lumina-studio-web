import { afterEach, describe, expect, it, vi } from "vitest";
import { restoreFace } from "./restore-face-api";

describe("restoreFace", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the canonical AI restore payload with guest session ownership", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          message: "Face restored successfully",
          restoredImage: "cmVzdG9yZWQ=",
          historyId: "history-1",
          operationType: "restore_face",
          processingMode: "cloud_ai",
          settingsUsed: {
            model: "CodeFormer",
          },
          outputFormat: "jpeg",
          processingTimeMs: 1200,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      restoreFace({
        image: "data:image/png;base64,aW1hZ2U=",
        huggingFaceToken: "hf_guest_token_123456",
        sessionId: "guest-session-1",
        outputFormat: "jpeg",
      }),
    ).resolves.toMatchObject({
      restoredImage: "cmVzdG9yZWQ=",
      historyId: "history-1",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/ai/restore-face",
      expect.objectContaining({
        method: "POST",
        headers: expect.any(Headers),
        body: JSON.stringify({
          image: "data:image/png;base64,aW1hZ2U=",
          huggingFaceToken: "hf_guest_token_123456",
          useSavedToken: undefined,
          settings: undefined,
          outputFormat: "jpeg",
        }),
      }),
    );
    expect((fetchMock.mock.calls[0][1].headers as Headers).get("x-session-id")).toBe("guest-session-1");
  });
});
