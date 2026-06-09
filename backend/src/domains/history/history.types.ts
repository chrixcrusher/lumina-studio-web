import type { OperationType, ProcessingMode } from "../../contracts/lumina";
import type { HistorySettings, HistoryStatus } from "../../persistence/mongodb/schemas/history.schema";

export interface HistoryOwnerDto {
  accountId?: string;
  sessionId?: string;
}

export interface HistoryListQueryDto {
  limit?: unknown;
  operationType?: unknown;
  processingMode?: unknown;
}

export interface CreateHistoryRequestDto {
  operationType?: unknown;
  processingMode?: unknown;
  settingsUsed?: unknown;
  outputFormat?: unknown;
  processingTimeMs?: unknown;
  status?: unknown;
  errorCode?: unknown;
}

export interface HistoryDto {
  id: string;
  operationType: OperationType;
  processingMode: ProcessingMode;
  settingsUsed?: HistorySettings;
  outputFormat?: string;
  processingTimeMs?: number;
  status: HistoryStatus;
  errorCode?: string;
  originalImageUrl: string | null;
  enhancedImageUrl: string | null;
  createdAt: string;
}

export interface HistoryListResponseDto {
  success: true;
  history: HistoryDto[];
}

export interface CreateHistoryResponseDto {
  success: true;
  message: string;
  historyId: string;
}

export interface DeleteHistoryResponseDto {
  success: true;
  message: string;
}
