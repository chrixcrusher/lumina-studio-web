import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { OPERATION_TYPES, PROCESSING_MODES } from "../../contracts/lumina";
import { getMaxUploadSizeBytes } from "../../common/deployment-config";
import { CodeFormerProvider } from "../../integrations/huggingface/codeformer.provider";
import { HuggingFaceTokenService } from "../../integrations/huggingface/hugging-face-token.service";
import { AccountRepository } from "../../persistence/repositories/account.repository";
import { HuggingFaceTokenEncryptionService } from "../account/account-token-encryption.service";
import { HistoryService } from "../history/history.service";
import type {
  RestoreFaceOwnerDto,
  RestoreFaceRequestDto,
  RestoreFaceResponseDto,
} from "./ai-restore.types";

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface ValidatedImage {
  imageBase64: string;
  contentType: string;
}

interface RestoreSettings {
  fidelity?: number;
}

type ResolvedRestoreOwner =
  | {
      kind: "account";
      accountId: string;
    }
  | {
      kind: "session";
      sessionId: string;
    };

@Injectable()
export class AiRestoreService {
  constructor(
    private readonly codeFormer: CodeFormerProvider,
    private readonly tokens: HuggingFaceTokenService,
    private readonly history: HistoryService,
    private readonly accounts: AccountRepository,
    private readonly tokenEncryption: HuggingFaceTokenEncryptionService,
  ) {}

  async restoreFace(
    owner: RestoreFaceOwnerDto,
    input: RestoreFaceRequestDto,
  ): Promise<RestoreFaceResponseDto> {
    const startedAt = Date.now();
    const resolvedOwner = this.requireOwner(owner);
    const image = this.requireImage(input.image);
    const settings = this.optionalSettings(input.settings);
    const outputFormat = this.optionalOutputFormat(input.outputFormat);
    const huggingFaceToken = await this.resolveHuggingFaceToken(resolvedOwner, input);

    const restored = await this.codeFormer.restoreFace({
      imageBase64: image.imageBase64,
      contentType: image.contentType,
      huggingFaceToken,
      fidelity: settings.fidelity,
      outputFormat,
    });
    const processingTimeMs = Date.now() - startedAt;
    const history = await this.history.createHistory(this.toHistoryOwner(resolvedOwner), {
      operationType: OPERATION_TYPES.restoreFace,
      processingMode: PROCESSING_MODES.cloudAi,
      settingsUsed: restored.settingsUsed,
      outputFormat: restored.outputFormat,
      processingTimeMs,
      status: "success",
    });

    return {
      success: true,
      message: "Face restored successfully",
      restoredImage: restored.restoredImage,
      historyId: history.historyId,
      operationType: OPERATION_TYPES.restoreFace,
      processingMode: PROCESSING_MODES.cloudAi,
      settingsUsed: restored.settingsUsed,
      outputFormat: restored.outputFormat,
      processingTimeMs,
    };
  }

  private requireOwner(owner: RestoreFaceOwnerDto): ResolvedRestoreOwner {
    if (typeof owner.accountId === "string" && owner.accountId.trim().length > 0) {
      return { kind: "account", accountId: owner.accountId.trim() };
    }

    if (typeof owner.sessionId === "string" && owner.sessionId.trim().length > 0) {
      return { kind: "session", sessionId: owner.sessionId.trim() };
    }

    throw new UnauthorizedException("Authorization bearer token or x-session-id is required.");
  }

  private requireImage(value: unknown): ValidatedImage {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new BadRequestException("Missing required field: image.");
    }

    const { imageBase64, declaredContentType } = this.normalizeImageValue(value);
    const imageBytes = Buffer.from(imageBase64, "base64");

    if (imageBytes.length === 0) {
      throw new BadRequestException("Invalid field: image.");
    }

    const maxUploadSizeBytes = getMaxUploadSizeBytes();

    if (imageBytes.length > maxUploadSizeBytes) {
      throw new HttpException(
        `Invalid field: image exceeds the ${Math.round(maxUploadSizeBytes / 1024 / 1024)} MB limit.`,
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }

    const detectedContentType = this.detectImageType(imageBytes);

    if (!detectedContentType || !SUPPORTED_IMAGE_TYPES.has(detectedContentType)) {
      throw new BadRequestException("Invalid field: image must be a JPEG, PNG, or WebP image.");
    }

    if (declaredContentType && declaredContentType !== detectedContentType) {
      throw new BadRequestException("Invalid field: image content type does not match image data.");
    }

    return {
      imageBase64,
      contentType: detectedContentType,
    };
  }

  private normalizeImageValue(value: string): {
    imageBase64: string;
    declaredContentType?: string;
  } {
    const trimmedValue = value.trim();
    const dataUrlMatch = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i.exec(trimmedValue);
    const declaredContentType = dataUrlMatch?.[1].toLowerCase();
    const rawBase64 = dataUrlMatch?.[2] ?? trimmedValue;
    const imageBase64 = rawBase64.replace(/\s/g, "");

    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(imageBase64) || imageBase64.length % 4 !== 0) {
      throw new BadRequestException("Invalid field: image must be base64 image data.");
    }

    return {
      imageBase64,
      declaredContentType,
    };
  }

  private detectImageType(bytes: Buffer): string | undefined {
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return "image/jpeg";
    }

    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return "image/png";
    }

    if (
      bytes.length >= 12 &&
      bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
      bytes.subarray(8, 12).toString("ascii") === "WEBP"
    ) {
      return "image/webp";
    }

    return undefined;
  }

  private optionalSettings(value: unknown): RestoreSettings {
    if (value === undefined) {
      return {};
    }

    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new BadRequestException("Invalid field: settings.");
    }

    const settings = value as { fidelity?: unknown };

    if (settings.fidelity === undefined) {
      return {};
    }

    if (typeof settings.fidelity !== "number" || settings.fidelity < 0 || settings.fidelity > 1) {
      throw new BadRequestException("Invalid field: settings.fidelity.");
    }

    return {
      fidelity: settings.fidelity,
    };
  }

  private optionalOutputFormat(value: unknown): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value !== "jpeg" && value !== "png" && value !== "webp") {
      throw new BadRequestException("Invalid field: outputFormat.");
    }

    return value;
  }

  private async resolveHuggingFaceToken(
    owner: ResolvedRestoreOwner,
    input: RestoreFaceRequestDto,
  ): Promise<string> {
    if (owner.kind === "session") {
      return this.tokens.requireRequestToken(input.huggingFaceToken);
    }

    const requestToken = this.tokens.optionalRequestToken(input.huggingFaceToken);

    if (requestToken) {
      return requestToken;
    }

    if (input.useSavedToken === false || input.useSavedToken === "false") {
      throw new UnauthorizedException("Missing required field: huggingFaceToken.");
    }

    const account = await this.accounts.findById(owner.accountId, {
      includeEncryptedHuggingFaceToken: true,
    });

    if (!account?.encryptedHuggingFaceToken) {
      throw new UnauthorizedException("Saved Hugging Face token is not configured.");
    }

    return this.tokenEncryption.decrypt(account.encryptedHuggingFaceToken);
  }

  private toHistoryOwner(owner: ResolvedRestoreOwner): RestoreFaceOwnerDto {
    return owner.kind === "account"
      ? { accountId: owner.accountId }
      : { sessionId: owner.sessionId };
  }
}
