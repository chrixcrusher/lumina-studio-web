import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { OPERATION_TYPES, PROCESSING_MODES } from "../../contracts/lumina";
import {
  HISTORY_STATUSES,
  HistoryDocument,
  HistorySettings,
  HistoryStatus,
} from "../../persistence/mongodb/schemas/history.schema";
import {
  CreateHistoryInput,
  HistoryRepository,
} from "../../persistence/repositories/history.repository";
import type {
  CreateHistoryRequestDto,
  CreateHistoryResponseDto,
  DeleteHistoryResponseDto,
  HistoryDto,
  HistoryListQueryDto,
  HistoryListResponseDto,
  HistoryOwnerDto,
} from "./history.types";

type ResolvedHistoryOwner =
  | {
      kind: "account";
      accountId: string;
    }
  | {
      kind: "session";
      sessionId: string;
    };

@Injectable()
export class HistoryService {
  constructor(private readonly history: HistoryRepository) {}

  async listHistory(
    owner: HistoryOwnerDto,
    query: HistoryListQueryDto = {},
  ): Promise<HistoryListResponseDto> {
    const resolvedOwner = this.requireOwner(owner);
    const operationType = this.optionalOperationType(query.operationType);
    const processingMode = this.optionalProcessingMode(query.processingMode);
    const limit = this.optionalLimit(query.limit);
    const records = resolvedOwner.kind === "account"
      ? await this.history.findByAccountId(resolvedOwner.accountId)
      : await this.history.findBySessionId(resolvedOwner.sessionId);

    const filtered = records
      .filter((record) => !operationType || record.operationType === operationType)
      .filter((record) => !processingMode || record.processingMode === processingMode)
      .slice(0, limit);

    return {
      success: true,
      history: filtered.map((record) => this.toHistoryDto(record)),
    };
  }

  async createHistory(
    owner: HistoryOwnerDto,
    input: CreateHistoryRequestDto,
  ): Promise<CreateHistoryResponseDto> {
    const resolvedOwner = this.requireOwner(owner);
    const createInput: CreateHistoryInput = {
      accountId: resolvedOwner.kind === "account" ? resolvedOwner.accountId : undefined,
      sessionId: resolvedOwner.kind === "session" ? resolvedOwner.sessionId : undefined,
      operationType: this.requireOperationType(input.operationType),
      processingMode: this.requireProcessingMode(input.processingMode),
      settingsUsed: this.optionalSettingsUsed(input.settingsUsed),
      outputFormat: this.optionalString(input.outputFormat, "outputFormat"),
      processingTimeMs: this.optionalProcessingTimeMs(input.processingTimeMs),
      status: this.requireStatus(input.status),
      errorCode: this.optionalString(input.errorCode, "errorCode"),
    };

    const record = await this.history.create(createInput);

    return {
      success: true,
      message: "History metadata saved",
      historyId: record.id,
    };
  }

  async deleteHistory(owner: HistoryOwnerDto, historyId: string): Promise<DeleteHistoryResponseDto> {
    const resolvedOwner = this.requireOwner(owner);
    this.validateHistoryId(historyId);

    const deleted = resolvedOwner.kind === "account"
      ? await this.history.deleteByIdForAccount(resolvedOwner.accountId, historyId)
      : await this.history.deleteByIdForSession(resolvedOwner.sessionId, historyId);

    if (!deleted) {
      throw new NotFoundException("History record not found.");
    }

    return {
      success: true,
      message: "History metadata deleted",
    };
  }

  private requireOwner(owner: HistoryOwnerDto): ResolvedHistoryOwner {
    if (typeof owner.accountId === "string" && owner.accountId.trim().length > 0) {
      return { kind: "account", accountId: owner.accountId.trim() };
    }

    if (typeof owner.sessionId === "string" && owner.sessionId.trim().length > 0) {
      return { kind: "session", sessionId: owner.sessionId.trim() };
    }

    throw new UnauthorizedException("Authorization bearer token or sessionId is required.");
  }

  private requireOperationType(value: unknown) {
    if (!Object.values(OPERATION_TYPES).includes(value as never)) {
      throw new BadRequestException("Invalid field: operationType.");
    }

    return value as (typeof OPERATION_TYPES)[keyof typeof OPERATION_TYPES];
  }

  private optionalOperationType(value: unknown) {
    if (value === undefined) {
      return undefined;
    }

    return this.requireOperationType(value);
  }

  private requireProcessingMode(value: unknown) {
    if (!Object.values(PROCESSING_MODES).includes(value as never)) {
      throw new BadRequestException("Invalid field: processingMode.");
    }

    return value as (typeof PROCESSING_MODES)[keyof typeof PROCESSING_MODES];
  }

  private optionalProcessingMode(value: unknown) {
    if (value === undefined) {
      return undefined;
    }

    return this.requireProcessingMode(value);
  }

  private requireStatus(value: unknown): HistoryStatus {
    if (!Object.values(HISTORY_STATUSES).includes(value as never)) {
      throw new BadRequestException("Invalid field: status.");
    }

    return value as HistoryStatus;
  }

  private optionalSettingsUsed(value: unknown): HistorySettings | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new BadRequestException("Invalid field: settingsUsed.");
    }

    return value as HistorySettings;
  }

  private optionalString(value: unknown, fieldName: string): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (typeof value !== "string") {
      throw new BadRequestException(`Invalid field: ${fieldName}.`);
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  }

  private optionalProcessingTimeMs(value: unknown): number | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
      throw new BadRequestException("Invalid field: processingTimeMs.");
    }

    return value;
  }

  private optionalLimit(value: unknown): number | undefined {
    if (value === undefined) {
      return undefined;
    }

    const limit = typeof value === "string" ? Number(value) : value;

    if (typeof limit !== "number" || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException("Invalid field: limit.");
    }

    return limit;
  }

  private validateHistoryId(value: string): void {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new BadRequestException("Missing required field: id.");
    }
  }

  private toHistoryDto(record: HistoryDocument): HistoryDto {
    return {
      id: record.id,
      operationType: record.operationType,
      processingMode: record.processingMode,
      settingsUsed: record.settingsUsed,
      outputFormat: record.outputFormat,
      processingTimeMs: record.processingTimeMs,
      status: record.status,
      errorCode: record.errorCode,
      originalImageUrl: record.originalImageUrl ?? null,
      enhancedImageUrl: record.enhancedImageUrl ?? null,
      createdAt: this.toIsoString(record.createdAt),
    };
  }

  private toIsoString(value: Date | string): string {
    return value instanceof Date ? value.toISOString() : value;
  }
}
