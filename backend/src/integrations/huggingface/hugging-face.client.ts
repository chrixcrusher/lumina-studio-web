import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { HuggingFaceTokenService } from "./hugging-face-token.service";
import type {
  HuggingFaceInferenceRequest,
  HuggingFaceInferenceResponse,
} from "./hugging-face.types";

const DEFAULT_CODEFORMER_SPACE_URL = "https://sczhou-codeformer.hf.space";
const DEFAULT_CODEFORMER_API_NAME = "inference";
const DEFAULT_CODEFORMER_FALLBACK_SPACE_URL = "https://leonelhs-codeformer.hf.space";
const DEFAULT_CODEFORMER_FALLBACK_API_NAME = "predict";
const DEFAULT_HUGGING_FACE_TIMEOUT_MS = 180_000;
const DEFAULT_CODEFORMER_FIDELITY = 0.5;
const CODEFORMER_FACE_ALIGN = true;
const CODEFORMER_BACKGROUND_ENHANCE = true;
const CODEFORMER_FACE_UPSAMPLE = true;
const CODEFORMER_UPSCALE = 2;

interface GradioCallResponse {
  event_id?: unknown;
}

interface GradioFileData {
  path?: unknown;
  url?: unknown;
  mime_type?: unknown;
}

interface CodeFormerEndpoint {
  baseUrl: string;
  apiName: string;
  mode: "official" | "single_image";
}

class CodeFormerProviderEventError extends Error {
  constructor() {
    super("CodeFormer provider returned an error event.");
  }
}

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
      return await this.runCodeFormerWithFallbacks(request, controller.signal);
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

  private async runCodeFormerWithFallbacks(
    request: HuggingFaceInferenceRequest,
    signal: AbortSignal,
  ): Promise<HuggingFaceInferenceResponse> {
    const endpoints = this.getCodeFormerEndpoints();
    let providerEventError = false;

    for (const endpoint of endpoints) {
      try {
        const eventId = await this.submitCodeFormerJob(endpoint, request, signal);
        const output = await this.waitForCodeFormerOutput(endpoint, eventId, signal);

        return await this.fetchRestoredImage(endpoint, output, signal);
      } catch (error) {
        if (!(error instanceof CodeFormerProviderEventError)) {
          throw error;
        }

        providerEventError = true;
        console.warn("[HuggingFaceClient] AI restore provider returned an error event.");
      }
    }

    if (providerEventError) {
      throw new BadGatewayException("AI restore failed while contacting Hugging Face.");
    }

    throw new BadGatewayException("AI restore failed while contacting Hugging Face.");
  }

  private async submitCodeFormerJob(
    endpoint: CodeFormerEndpoint,
    request: HuggingFaceInferenceRequest,
    signal: AbortSignal,
  ): Promise<string> {
    const imageData = await this.uploadImage(endpoint, request, signal);
    const response = await fetch(this.buildCodeFormerApiUrl(endpoint), {
      method: "POST",
      headers: {
        Authorization: this.tokens.createAuthorizationHeader(request.huggingFaceToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: this.toCodeFormerInputs(endpoint, imageData, request.fidelity),
      }),
      signal,
    });

    if (!response.ok) {
      this.handleProviderError(response.status);
    }

    const payload = await response.json() as GradioCallResponse;

    if (typeof payload.event_id !== "string" || payload.event_id.trim().length === 0) {
      throw new BadGatewayException("AI restore failed while contacting Hugging Face.");
    }

    return payload.event_id;
  }

  private async uploadImage(
    endpoint: CodeFormerEndpoint,
    request: HuggingFaceInferenceRequest,
    signal: AbortSignal,
  ): Promise<Record<string, unknown>> {
    const imageBytes = Buffer.from(request.imageBase64, "base64");
    const fileName = `lumina-restore.${this.toFileExtension(request.contentType)}`;
    const formData = new FormData();
    formData.append("files", new Blob([imageBytes], { type: request.contentType }), fileName);

    const response = await fetch(this.buildCodeFormerUploadUrl(endpoint), {
      method: "POST",
      headers: {
        Authorization: this.tokens.createAuthorizationHeader(request.huggingFaceToken),
      },
      body: formData,
      signal,
    });

    if (!response.ok) {
      this.handleProviderError(response.status);
    }

    const payload = await response.json() as unknown;

    if (!Array.isArray(payload) || typeof payload[0] !== "string" || payload[0].trim().length === 0) {
      throw new BadGatewayException("AI restore failed while contacting Hugging Face.");
    }

    return this.toGradioImageData(endpoint, payload[0], fileName, imageBytes.length, request.contentType);
  }

  private async waitForCodeFormerOutput(
    endpoint: CodeFormerEndpoint,
    eventId: string,
    signal: AbortSignal,
  ): Promise<GradioFileData> {
    const response = await fetch(this.buildCodeFormerApiUrl(endpoint, eventId), {
      method: "GET",
      headers: {
        Accept: "text/event-stream",
      },
      signal,
    });

    if (!response.ok) {
      this.handleProviderError(response.status);
    }

    return this.parseCodeFormerEventStream(endpoint, await response.text());
  }

  private async fetchRestoredImage(
    endpoint: CodeFormerEndpoint,
    output: GradioFileData,
    signal: AbortSignal,
  ): Promise<HuggingFaceInferenceResponse> {
    const outputUrl = this.resolveGradioFileUrl(endpoint, output);
    const response = await fetch(outputUrl, {
      method: "GET",
      signal,
    });

    if (!response.ok) {
      this.handleProviderError(response.status);
    }

    return {
      imageBase64: Buffer.from(await response.arrayBuffer()).toString("base64"),
      contentType: response.headers.get("content-type") ?? this.toStringValue(output.mime_type) ?? "image/png",
    };
  }

  private parseCodeFormerEventStream(endpoint: CodeFormerEndpoint, stream: string): GradioFileData {
    const events = this.parseServerSentEvents(stream);
    const errorEvent = events.find((event) => event.name === "error");

    if (errorEvent) {
      throw new CodeFormerProviderEventError();
    }

    const completeEvent = events.find((event) => event.name === "complete");

    if (!completeEvent) {
      throw new BadGatewayException("AI restore failed while contacting Hugging Face.");
    }

    const data = JSON.parse(completeEvent.data) as unknown;

    const output = this.resolveCodeFormerOutput(endpoint, data);

    if (!output) {
      throw new BadGatewayException("AI restore failed while contacting Hugging Face.");
    }

    return output;
  }

  private parseServerSentEvents(stream: string): Array<{ name: string; data: string }> {
    return stream
      .split(/\r?\n\r?\n/)
      .map((chunk) => {
        const eventLine = chunk.split(/\r?\n/).find((line) => line.startsWith("event:"));
        const dataLine = chunk.split(/\r?\n/).find((line) => line.startsWith("data:"));

        return {
          name: eventLine?.slice("event:".length).trim() ?? "",
          data: dataLine?.slice("data:".length).trim() ?? "",
        };
      })
      .filter((event) => event.name.length > 0);
  }

  private toGradioImageData(
    endpoint: CodeFormerEndpoint,
    path: string,
    fileName: string,
    size: number,
    contentType: string,
  ): Record<string, unknown> {
    return {
      path,
      url: new URL(`/gradio_api/file=${path}`, endpoint.baseUrl).toString(),
      size,
      orig_name: fileName,
      mime_type: contentType,
      is_stream: false,
      meta: {
        _type: "gradio.FileData",
      },
    };
  }

  private toCodeFormerInputs(
    endpoint: CodeFormerEndpoint,
    imageData: Record<string, unknown>,
    fidelity: number | undefined,
  ): unknown[] {
    if (endpoint.mode === "single_image") {
      return [imageData];
    }

    return [
      imageData,
      CODEFORMER_FACE_ALIGN,
      CODEFORMER_BACKGROUND_ENHANCE,
      CODEFORMER_FACE_UPSAMPLE,
      CODEFORMER_UPSCALE,
      fidelity ?? DEFAULT_CODEFORMER_FIDELITY,
    ];
  }

  private resolveCodeFormerOutput(endpoint: CodeFormerEndpoint, data: unknown): GradioFileData | undefined {
    if (endpoint.mode === "single_image") {
      if (!Array.isArray(data) || !Array.isArray(data[0])) {
        return undefined;
      }

      const output = data[0][1] ?? data[0][0];
      return this.isGradioFileData(output) ? output : undefined;
    }

    if (!Array.isArray(data) || !this.isGradioFileData(data[0])) {
      return undefined;
    }

    return data[0];
  }

  private resolveGradioFileUrl(endpoint: CodeFormerEndpoint, output: GradioFileData): string {
    const url = this.toStringValue(output.url);

    if (url) {
      return url;
    }

    const path = this.toStringValue(output.path);

    if (!path) {
      throw new BadGatewayException("AI restore failed while contacting Hugging Face.");
    }

    return new URL(`/gradio_api/file=${path}`, endpoint.baseUrl).toString();
  }

  private buildCodeFormerUploadUrl(endpoint: CodeFormerEndpoint): string {
    return new URL("/gradio_api/upload", endpoint.baseUrl).toString();
  }

  private buildCodeFormerApiUrl(endpoint: CodeFormerEndpoint, eventId?: string): string {
    const encodedApiName = encodeURIComponent(endpoint.apiName).replace(/%2F/gi, "/");
    const path = eventId
      ? `/gradio_api/call/${encodedApiName}/${encodeURIComponent(eventId)}`
      : `/gradio_api/call/${encodedApiName}`;

    return new URL(path, endpoint.baseUrl).toString();
  }

  private getCodeFormerEndpoints(): CodeFormerEndpoint[] {
    const configuredSpaceUrl = process.env.HUGGING_FACE_CODEFORMER_SPACE_URL?.trim();
    const configuredApiName = process.env.HUGGING_FACE_CODEFORMER_API_NAME?.trim();

    if (configuredSpaceUrl) {
      return [{
        baseUrl: configuredSpaceUrl,
        apiName: configuredApiName || DEFAULT_CODEFORMER_API_NAME,
        mode: "official",
      }];
    }

    return [
      {
        baseUrl: DEFAULT_CODEFORMER_SPACE_URL,
        apiName: configuredApiName || DEFAULT_CODEFORMER_API_NAME,
        mode: "official",
      },
      {
        baseUrl: DEFAULT_CODEFORMER_FALLBACK_SPACE_URL,
        apiName: DEFAULT_CODEFORMER_FALLBACK_API_NAME,
        mode: "single_image",
      },
    ];
  }

  private handleProviderError(status: number): never {
    console.warn(`[HuggingFaceClient] AI restore provider returned HTTP ${status}.`);

    if (status === 400 || status === 422) {
      throw new BadGatewayException("AI restore failed because the configured Hugging Face endpoint does not support this restore request.");
    }

    if (status === 401 || status === 403) {
      throw new UnauthorizedException("AI restore failed because the Hugging Face token was rejected.");
    }

    if (status === 404) {
      throw new BadGatewayException("AI restore failed because the Hugging Face model is unavailable.");
    }

    if (status === 429) {
      throw new HttpException(
        "AI restore failed because Hugging Face quota was exceeded.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (status === 504) {
      throw new GatewayTimeoutException("AI restore failed because Hugging Face timed out.");
    }

    if (status === 503) {
      throw new ServiceUnavailableException("AI restore failed because Hugging Face is temporarily unavailable.");
    }

    throw new BadGatewayException("AI restore failed while contacting Hugging Face.");
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === "AbortError";
  }

  private isGradioFileData(value: unknown): value is GradioFileData {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return false;
    }

    const file = value as GradioFileData;
    return typeof file.url === "string" || typeof file.path === "string";
  }

  private toStringValue(value: unknown): string | undefined {
    return typeof value === "string" && value.trim().length > 0 ? value : undefined;
  }

  private toFileExtension(contentType: string): string {
    if (contentType === "image/png") {
      return "png";
    }

    if (contentType === "image/webp") {
      return "webp";
    }

    return "jpg";
  }
}
