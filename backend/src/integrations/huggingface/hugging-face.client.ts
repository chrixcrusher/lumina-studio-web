import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { HuggingFaceTokenService } from "./hugging-face-token.service";
import type {
  HuggingFaceInferenceRequest,
  HuggingFaceInferenceResponse,
} from "./hugging-face.types";

const DEFAULT_HUGGING_FACE_BASE_URL = "https://api-inference.huggingface.co/models";
const DEFAULT_HUGGING_FACE_TIMEOUT_MS = 30_000;

@Injectable()
export class HuggingFaceClient {
  constructor(private readonly tokens: HuggingFaceTokenService) {}

  async runImageInference(
    request: HuggingFaceInferenceRequest,
  ): Promise<HuggingFaceInferenceResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      request.timeoutMs ?? DEFAULT_HUGGING_FACE_TIMEOUT_MS,
    );

    try {
      const response = await fetch(this.buildModelUrl(request.model), {
        method: "POST",
        headers: {
          Authorization: this.tokens.createAuthorizationHeader(request.huggingFaceToken),
          "Content-Type": request.contentType ?? "application/octet-stream",
        },
        body: Buffer.from(request.imageBase64, "base64"),
        signal: controller.signal,
      });

      if (!response.ok) {
        this.handleProviderError(response.status);
      }

      return {
        imageBase64: Buffer.from(await response.arrayBuffer()).toString("base64"),
        contentType: response.headers.get("content-type") ?? "application/octet-stream",
      };
    } catch (error) {
      if (this.isAbortError(error)) {
        throw new GatewayTimeoutException("AI restore failed because Hugging Face timed out.");
      }

      if (error instanceof HttpException) {
        throw error;
      }

      throw new BadGatewayException("AI restore failed while contacting Hugging Face.");
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildModelUrl(model: string): string {
    const baseUrl = process.env.HUGGING_FACE_INFERENCE_BASE_URL?.trim() ||
      DEFAULT_HUGGING_FACE_BASE_URL;

    return `${baseUrl}/${encodeURIComponent(model)}`;
  }

  private handleProviderError(status: number): never {
    if (status === 429) {
      throw new HttpException(
        "AI restore failed because Hugging Face quota was exceeded.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (status === 504) {
      throw new GatewayTimeoutException("AI restore failed because Hugging Face timed out.");
    }

    throw new BadGatewayException("AI restore failed while contacting Hugging Face.");
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === "AbortError";
  }
}
