import { BadRequestException, Injectable } from "@nestjs/common";
import { HuggingFaceClient } from "./hugging-face.client";
import type {
  CodeFormerRestoreFaceRequest,
  CodeFormerRestoreFaceResponse,
} from "./hugging-face.types";

const DEFAULT_OUTPUT_FORMAT = "jpeg";

@Injectable()
export class CodeFormerProvider {
  constructor(private readonly huggingFace: HuggingFaceClient) {}

  async restoreFace(
    request: CodeFormerRestoreFaceRequest,
  ): Promise<CodeFormerRestoreFaceResponse> {
    const fidelity = this.optionalFidelity(request.fidelity);
    const outputFormat = this.optionalOutputFormat(request.outputFormat);
    const response = await this.huggingFace.runImageInference({
      imageBase64: this.requireImageBase64(request.imageBase64),
      huggingFaceToken: request.huggingFaceToken,
      contentType: this.requireContentType(request.contentType),
      fidelity,
    });

    return {
      restoredImage: response.imageBase64,
      settingsUsed: {
        model: "CodeFormer",
        ...(fidelity === undefined ? {} : { fidelity }),
      },
      outputFormat: this.toOutputFormat(response.contentType) ?? outputFormat,
    };
  }

  private requireImageBase64(value: unknown): string {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new BadRequestException("Missing required field: image.");
    }

    return value.trim();
  }

  private optionalFidelity(value: unknown): number | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (typeof value !== "number" || value < 0 || value > 1) {
      throw new BadRequestException("Invalid field: settings.fidelity.");
    }

    return value;
  }

  private optionalOutputFormat(value: unknown): string {
    if (value === undefined) {
      return DEFAULT_OUTPUT_FORMAT;
    }

    if (value !== "jpeg" && value !== "png" && value !== "webp") {
      throw new BadRequestException("Invalid field: outputFormat.");
    }

    return value;
  }

  private requireContentType(value: unknown): string {
    if (value !== "image/jpeg" && value !== "image/png" && value !== "image/webp") {
      throw new BadRequestException("Invalid field: image content type.");
    }

    return value;
  }

  private toOutputFormat(contentType: string): string | undefined {
    if (contentType.startsWith("image/png")) {
      return "png";
    }

    if (contentType.startsWith("image/webp")) {
      return "webp";
    }

    if (contentType.startsWith("image/jpeg") || contentType.startsWith("image/jpg")) {
      return "jpeg";
    }

    return undefined;
  }
}
