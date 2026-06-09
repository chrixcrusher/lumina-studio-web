import type { OperationType, ProcessingMode } from "../../contracts/lumina";
import type { HistorySettings } from "../../persistence/mongodb/schemas/history.schema";

export interface RestoreFaceRequestDto {
  image?: unknown;
  huggingFaceToken?: unknown;
  useSavedToken?: unknown;
  settings?: unknown;
  outputFormat?: unknown;
}

export interface RestoreFaceOwnerDto {
  accountId?: string;
  sessionId?: string;
}

export interface RestoreFaceResponseDto {
  success: true;
  message: string;
  restoredImage: string;
  historyId: string;
  operationType: OperationType;
  processingMode: ProcessingMode;
  settingsUsed: HistorySettings;
  outputFormat?: string;
  processingTimeMs: number;
}
