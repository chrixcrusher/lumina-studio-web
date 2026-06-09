import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema } from "mongoose";
import { OPERATION_TYPES, OperationType, PROCESSING_MODES, ProcessingMode } from "../../../contracts/lumina";
import { Account } from "./account.schema";

export const HISTORY_COLLECTION = "histories";

export const HISTORY_STATUSES = {
  success: "success",
  failed: "failed",
} as const;

export type HistoryStatus = (typeof HISTORY_STATUSES)[keyof typeof HISTORY_STATUSES];
export type HistorySettings = Record<string, unknown>;

@Schema({
  collection: HISTORY_COLLECTION,
  timestamps: {
    createdAt: true,
    updatedAt: false,
  },
  versionKey: false,
})
export class History {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Account.name,
    required: false,
    index: true,
  })
  accountId?: string;

  @Prop({ type: String, required: false, trim: true, index: true })
  sessionId?: string;

  @Prop({ type: String, required: false, default: null, trim: true })
  originalImageUrl?: string | null;

  @Prop({ type: String, required: false, default: null, trim: true })
  enhancedImageUrl?: string | null;

  @Prop({ type: String, required: true, enum: Object.values(OPERATION_TYPES) })
  operationType!: OperationType;

  @Prop({ type: String, required: true, enum: Object.values(PROCESSING_MODES) })
  processingMode!: ProcessingMode;

  @Prop({ type: Object, required: false })
  settingsUsed?: HistorySettings;

  @Prop({ type: String, required: false, trim: true })
  outputFormat?: string;

  @Prop({ type: Number, required: false, min: 0 })
  processingTimeMs?: number;

  @Prop({ type: String, required: true, enum: Object.values(HISTORY_STATUSES) })
  status!: HistoryStatus;

  @Prop({ type: String, required: false, trim: true })
  errorCode?: string;

  createdAt!: Date;
}

export type HistoryDocument = HydratedDocument<History>;

export const HistorySchema = SchemaFactory.createForClass(History);

HistorySchema.index({ accountId: 1, createdAt: -1 });
HistorySchema.index({ sessionId: 1, createdAt: -1 });
HistorySchema.index({ operationType: 1 });
HistorySchema.index({ processingMode: 1 });

HistorySchema.pre("validate", function validateHistoryOwner() {
  if (this.accountId || this.sessionId) {
    return;
  }

  this.invalidate("accountId", "accountId or sessionId is required");
  this.invalidate("sessionId", "accountId or sessionId is required");
});
