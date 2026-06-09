import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { OperationType, ProcessingMode } from "../../contracts/lumina";
import {
  History,
  HistoryDocument,
  HistorySettings,
  HistoryStatus,
} from "../mongodb/schemas/history.schema";

export interface CreateHistoryInput {
  accountId?: string;
  sessionId?: string;
  originalImageUrl?: string | null;
  enhancedImageUrl?: string | null;
  operationType: OperationType;
  processingMode: ProcessingMode;
  settingsUsed?: HistorySettings;
  outputFormat?: string;
  processingTimeMs?: number;
  status: HistoryStatus;
  errorCode?: string;
}

@Injectable()
export class HistoryRepository {
  constructor(
    @InjectModel(History.name)
    private readonly historyModel: Model<HistoryDocument>,
  ) {}

  async create(input: CreateHistoryInput): Promise<HistoryDocument> {
    return this.historyModel.create({
      accountId: input.accountId,
      sessionId: input.sessionId,
      originalImageUrl: input.originalImageUrl ?? null,
      enhancedImageUrl: input.enhancedImageUrl ?? null,
      operationType: input.operationType,
      processingMode: input.processingMode,
      settingsUsed: input.settingsUsed,
      outputFormat: input.outputFormat,
      processingTimeMs: input.processingTimeMs,
      status: input.status,
      errorCode: input.errorCode,
    });
  }

  async findByAccountId(accountId: string): Promise<HistoryDocument[]> {
    return this.historyModel.find({ accountId }).sort({ createdAt: -1 }).exec();
  }

  async findBySessionId(sessionId: string): Promise<HistoryDocument[]> {
    return this.historyModel.find({ sessionId }).sort({ createdAt: -1 }).exec();
  }

  async deleteByIdForAccount(accountId: string, historyId: string): Promise<boolean> {
    const result = await this.historyModel.deleteOne({ _id: historyId, accountId }).exec();

    return result.deletedCount === 1;
  }

  async deleteByIdForSession(sessionId: string, historyId: string): Promise<boolean> {
    const result = await this.historyModel.deleteOne({ _id: historyId, sessionId }).exec();

    return result.deletedCount === 1;
  }
}
