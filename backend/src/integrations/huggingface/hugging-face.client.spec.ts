import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HuggingFaceTokenService } from "./hugging-face-token.service";
import { HuggingFaceClient } from "./hugging-face.client";

describe("HuggingFaceClient", () => {
  const originalFetch = globalThis.fetch;
  const tokens = new HuggingFaceTokenService();
  let client: HuggingFaceClient;

  beforeEach(() => {
    client = new HuggingFaceClient(tokens);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("calls Hugging Face with bearer auth and maps image bytes to base64", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
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
        model: "sczhou/CodeFormer",
        imageBase64: Buffer.from("original image").toString("base64"),
        huggingFaceToken: "hf_secret_token_123456",
        contentType: "image/jpeg",
      }),
    ).resolves.toEqual({
      imageBase64: Buffer.from("restored image").toString("base64"),
      contentType: "image/png",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api-inference.huggingface.co/models/sczhou%2FCodeFormer",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer hf_secret_token_123456",
          "Content-Type": "image/jpeg",
        }),
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
        model: "sczhou/CodeFormer",
        imageBase64: "aW1hZ2U=",
        huggingFaceToken: "hf_secret_token_123456",
      }),
    ).rejects.toMatchObject({
      message: "AI restore failed while contacting Hugging Face.",
    });
  });

  it("maps quota and timeout responses to safe API errors", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 429 }));

    await expectQuotaError(
      client.runImageInference({
        model: "sczhou/CodeFormer",
        imageBase64: "aW1hZ2U=",
        huggingFaceToken: "hf_secret_token_123456",
      }),
    );

    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 504 }));

    await expect(
      client.runImageInference({
        model: "sczhou/CodeFormer",
        imageBase64: "aW1hZ2U=",
        huggingFaceToken: "hf_secret_token_123456",
      }),
    ).rejects.toBeInstanceOf(GatewayTimeoutException);
  });

  it("maps network failures to safe Hugging Face errors", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("connection failed"));

    await expect(
      client.runImageInference({
        model: "sczhou/CodeFormer",
        imageBase64: "aW1hZ2U=",
        huggingFaceToken: "hf_secret_token_123456",
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
