import type { OperationType, ProcessingMode } from "@/shared/constants/lumina";

export interface HistoryRecord {
  id: string;
  operationType: OperationType;
  processingMode: ProcessingMode;
  settingsUsed?: Record<string, unknown>;
  outputFormat?: string;
  processingTimeMs?: number;
  status: "success" | "failed";
  errorCode?: string;
  originalImageUrl: string | null;
  enhancedImageUrl: string | null;
  createdAt: string;
}

export interface CreateHistoryRequest {
  operationType: OperationType;
  processingMode: ProcessingMode;
  settingsUsed?: Record<string, unknown>;
  outputFormat?: string;
  processingTimeMs?: number;
  status: "success" | "failed";
  errorCode?: string;
}

export interface CreateHistoryResponse {
  success: true;
  message: string;
  historyId: string;
}
