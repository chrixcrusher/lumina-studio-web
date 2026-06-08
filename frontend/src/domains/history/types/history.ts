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
