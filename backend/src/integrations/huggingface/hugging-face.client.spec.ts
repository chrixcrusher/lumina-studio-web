import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HuggingFaceTokenService } from "./hugging-face-token.service";
import { HuggingFaceClient } from "./hugging-face.client";

describe("HuggingFaceClient", () => {
  const originalFetch = globalThis.fetch;
  const originalCodeFormerSpaceUrl = process.env.HUGGING_FACE_CODEFORMER_SPACE_URL;
  const originalCodeFormerApiName = process.env.HUGGING_FACE_CODEFORMER_API_NAME;
  const tokens = new HuggingFaceTokenService();
  let client: HuggingFaceClient;

  beforeEach(() => {
    client = new HuggingFaceClient(tokens);
    vi.restoreAllMocks();
    delete process.env.HUGGING_FACE_CODEFORMER_SPACE_URL;
    delete process.env.HUGGING_FACE_CODEFORMER_API_NAME;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    restoreEnv("HUGGING_FACE_CODEFORMER_SPACE_URL", originalCodeFormerSpaceUrl);
    restoreEnv("HUGGING_FACE_CODEFORMER_API_NAME", originalCodeFormerApiName);
  });

  it("calls the CodeFormer Space with bearer auth and maps output bytes to base64", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(["/tmp/gradio/upload/lumina-restore.jpg"]), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ event_id: "event-1" }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          [
            "event: complete",
            'data: [{"url":"https://sczhou-codeformer.hf.space/gradio_api/file=/tmp/restored.png","mime_type":"image/png"},null]',
            "",
            "",
          ].join("\n"),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(Buffer.from("restored image"), {
          status: 200,
          headers: {
            "content-type": "image/png",
          },
        }),
      );
    globalThis.fetch = fetchMock;

    await expect(
      client.runImageInference({
        imageBase64: Buffer.from("original image").toString("base64"),
        huggingFaceToken: "hf_secret_token_123456",
        contentType: "image/jpeg",
        fidelity: 0.7,
      }),
    ).resolves.toEqual({
      imageBase64: Buffer.from("restored image").toString("base64"),
      contentType: "image/png",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://sczhou-codeformer.hf.space/gradio_api/upload",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer hf_secret_token_123456",
        }),
        body: expect.any(FormData),
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://sczhou-codeformer.hf.space/gradio_api/call/inference",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer hf_secret_token_123456",
          "Content-Type": "application/json",
        }),
      }),
    );
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toMatchObject({
      data: [
        {
          path: "/tmp/gradio/upload/lumina-restore.jpg",
          url: "https://sczhou-codeformer.hf.space/gradio_api/file=/tmp/gradio/upload/lumina-restore.jpg",
          size: 14,
          orig_name: "lumina-restore.jpg",
          mime_type: "image/jpeg",
        },
        true,
        true,
        true,
        2,
        0.7,
      ],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://sczhou-codeformer.hf.space/gradio_api/call/inference/event-1",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://sczhou-codeformer.hf.space/gradio_api/file=/tmp/restored.png",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("maps Hugging Face failures without exposing provider bodies or tokens", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "hf_secret_token_123456 provider detail" }), {
        status: 502,
      }),
    );

    await expect(
      client.runImageInference({
        imageBase64: "aW1hZ2U=",
        huggingFaceToken: "hf_secret_token_123456",
        contentType: "image/png",
      }),
    ).rejects.toMatchObject({
      message: "AI restore failed while contacting Hugging Face.",
    });
  });

  it("maps unsupported endpoint responses to a setup-focused safe error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 400 }));

    await expect(
      client.runImageInference({
        imageBase64: "aW1hZ2U=",
        huggingFaceToken: "hf_secret_token_123456",
        contentType: "image/png",
      }),
    ).rejects.toMatchObject({
      message: "AI restore failed because the configured Hugging Face endpoint does not support this restore request.",
    });
  });

  it("falls back to a single-image CodeFormer Space when the default Space emits an error event", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(["/tmp/gradio/official/lumina-restore.jpg"]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ event_id: "official-event" }), { status: 200 }))
      .mockResolvedValueOnce(new Response("event: error\ndata: null\n\n", { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(["/tmp/gradio/fallback/lumina-restore.jpg"]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ event_id: "fallback-event" }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          [
            "event: complete",
            'data: [[{"url":"https://leonelhs-codeformer.hf.space/gradio_api/file=/tmp/original.jpg"},{"url":"https://leonelhs-codeformer.hf.space/gradio_api/file=/tmp/restored.webp","mime_type":"image/webp"}]]',
            "",
            "",
          ].join("\n"),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(Buffer.from("fallback restored image"), {
          status: 200,
          headers: {
            "content-type": "image/webp",
          },
        }),
      );
    globalThis.fetch = fetchMock;

    await expect(
      client.runImageInference({
        imageBase64: "aW1hZ2U=",
        huggingFaceToken: "hf_secret_token_123456",
        contentType: "image/jpeg",
      }),
    ).resolves.toEqual({
      imageBase64: Buffer.from("fallback restored image").toString("base64"),
      contentType: "image/webp",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://leonelhs-codeformer.hf.space/gradio_api/upload",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://leonelhs-codeformer.hf.space/gradio_api/call/predict",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(JSON.parse(fetchMock.mock.calls[4][1].body as string)).toMatchObject({
      data: [
        {
          path: "/tmp/gradio/fallback/lumina-restore.jpg",
        },
      ],
    });
  });

  it("maps provider error events to safe Hugging Face errors", async () => {
    process.env.HUGGING_FACE_CODEFORMER_SPACE_URL = "https://custom-codeformer.hf.space";
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(["/tmp/gradio/upload/lumina-restore.png"]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ event_id: "event-1" }), { status: 200 }))
      .mockResolvedValueOnce(new Response("event: error\ndata: null\n\n", { status: 200 }));

    await expect(
      client.runImageInference({
        imageBase64: "aW1hZ2U=",
        huggingFaceToken: "hf_secret_token_123456",
        contentType: "image/png",
      }),
    ).rejects.toMatchObject({
      message: "AI restore failed while contacting Hugging Face.",
    });
  });

  it("maps quota and timeout responses to safe API errors", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 429 }));

    await expectQuotaError(
      client.runImageInference({
        imageBase64: "aW1hZ2U=",
        huggingFaceToken: "hf_secret_token_123456",
        contentType: "image/png",
      }),
    );

    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 504 }));

    await expect(
      client.runImageInference({
        imageBase64: "aW1hZ2U=",
        huggingFaceToken: "hf_secret_token_123456",
        contentType: "image/png",
      }),
    ).rejects.toBeInstanceOf(GatewayTimeoutException);
  });

  it("maps rejected tokens and unavailable models to safe API errors", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));

    await expect(
      client.runImageInference({
        imageBase64: "aW1hZ2U=",
        huggingFaceToken: "hf_secret_token_123456",
        contentType: "image/png",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));

    await expect(
      client.runImageInference({
        imageBase64: "aW1hZ2U=",
        huggingFaceToken: "hf_secret_token_123456",
        contentType: "image/png",
      }),
    ).rejects.toMatchObject({
      message: "AI restore failed because the Hugging Face model is unavailable.",
    });

    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));

    await expect(
      client.runImageInference({
        imageBase64: "aW1hZ2U=",
        huggingFaceToken: "hf_secret_token_123456",
        contentType: "image/png",
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("maps network failures to safe Hugging Face errors", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("connection failed"));

    await expect(
      client.runImageInference({
        imageBase64: "aW1hZ2U=",
        huggingFaceToken: "hf_secret_token_123456",
        contentType: "image/png",
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});

async function expectQuotaError(promise: Promise<unknown>): Promise<void> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect((error as Error).message).not.toContain("hf_secret_token_123456");
    return;
  }

  throw new Error("Expected Hugging Face quota error.");
}

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
