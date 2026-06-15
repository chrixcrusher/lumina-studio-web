import { BadRequestException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HuggingFaceClient } from "./hugging-face.client";
import { CodeFormerProvider } from "./codeformer.provider";

describe("CodeFormerProvider", () => {
  let huggingFace: {
    runImageInference: ReturnType<typeof vi.fn>;
  };
  let provider: CodeFormerProvider;

  beforeEach(() => {
    huggingFace = {
      runImageInference: vi.fn(),
    };
    provider = new CodeFormerProvider(huggingFace as unknown as HuggingFaceClient);
  });

  it("maps restore requests to the CodeFormer Hugging Face Space", async () => {
    huggingFace.runImageInference.mockResolvedValue({
      imageBase64: "cmVzdG9yZWQ=",
      contentType: "image/png",
    });

    await expect(
      provider.restoreFace({
        imageBase64: "aW1hZ2U=",
        contentType: "image/jpeg",
        huggingFaceToken: "hf_secret_token_123456",
        fidelity: 0.7,
        outputFormat: "jpeg",
      }),
    ).resolves.toEqual({
      restoredImage: "cmVzdG9yZWQ=",
      settingsUsed: {
        model: "CodeFormer",
        fidelity: 0.7,
      },
      outputFormat: "png",
    });

    expect(huggingFace.runImageInference).toHaveBeenCalledWith({
      imageBase64: "aW1hZ2U=",
      huggingFaceToken: "hf_secret_token_123456",
      contentType: "image/jpeg",
      fidelity: 0.7,
    });
  });

  it("validates image, fidelity, and output format fields", async () => {
    await expect(
      provider.restoreFace({
        imageBase64: "",
        contentType: "image/png",
        huggingFaceToken: "hf_secret_token_123456",
      }),
    ).rejects.toMatchObject({
      message: "Missing required field: image.",
    });

    await expect(
      provider.restoreFace({
        imageBase64: "aW1hZ2U=",
        contentType: "image/png",
        huggingFaceToken: "hf_secret_token_123456",
        fidelity: 1.5,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      provider.restoreFace({
        imageBase64: "aW1hZ2U=",
        contentType: "image/png",
        huggingFaceToken: "hf_secret_token_123456",
        outputFormat: "gif",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
