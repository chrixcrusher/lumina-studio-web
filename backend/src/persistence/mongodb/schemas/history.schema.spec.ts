import { model } from "mongoose";
import { describe, expect, it } from "vitest";
import { OPERATION_TYPES, PROCESSING_MODES } from "../../../contracts/lumina";
import { HISTORY_COLLECTION, History, HistorySchema } from "./history.schema";

const HistorySchemaSpecModel = model<History>("HistorySchemaSpec", HistorySchema.clone());

describe("HistorySchema", () => {
  it("uses the canonical histories collection and createdAt timestamps", () => {
    expect(HistorySchema.options.collection).toBe(HISTORY_COLLECTION);
    expect(HistorySchema.options.timestamps).toEqual({
      createdAt: true,
      updatedAt: false,
    });
  });

  it("defines ownership and canonical metadata indexes", () => {
    const hasAccountCreatedAtIndex = HistorySchema.indexes().some(([fields]) => {
      return fields.accountId === 1 && fields.createdAt === -1;
    });
    const hasSessionCreatedAtIndex = HistorySchema.indexes().some(([fields]) => {
      return fields.sessionId === 1 && fields.createdAt === -1;
    });
    const hasOperationTypeIndex = HistorySchema.indexes().some(([fields]) => fields.operationType === 1);
    const hasProcessingModeIndex = HistorySchema.indexes().some(([fields]) => fields.processingMode === 1);

    expect(hasAccountCreatedAtIndex).toBe(true);
    expect(hasSessionCreatedAtIndex).toBe(true);
    expect(hasOperationTypeIndex).toBe(true);
    expect(hasProcessingModeIndex).toBe(true);
  });

  it("validates authenticated metadata-only history records", async () => {
    const history = new HistorySchemaSpecModel({
      accountId: "65f1a2b3c4d5e6f7a8b9c0d1",
      operationType: OPERATION_TYPES.restoreFace,
      processingMode: PROCESSING_MODES.cloudAi,
      settingsUsed: {
        model: "CodeFormer",
        fidelity: 0.7,
      },
      outputFormat: "jpeg",
      processingTimeMs: 4200,
      status: "success",
    });

    await expect(history.validate()).resolves.toBeUndefined();
    expect(history.originalImageUrl).toBeNull();
    expect(history.enhancedImageUrl).toBeNull();
    expect(history.settingsUsed).toEqual({
      model: "CodeFormer",
      fidelity: 0.7,
    });
  });

  it("validates guest browser operation history records", async () => {
    const history = new HistorySchemaSpecModel({
      sessionId: "guest-session-1",
      operationType: OPERATION_TYPES.textOverlay,
      processingMode: PROCESSING_MODES.browser,
      settingsUsed: {
        text: "Portrait",
        color: "#ffffff",
      },
      status: "failed",
      errorCode: "TEXT_LAYER_INVALID",
    });

    await expect(history.validate()).resolves.toBeUndefined();
  });

  it("rejects records without account or session ownership", async () => {
    const history = new HistorySchemaSpecModel({
      operationType: OPERATION_TYPES.filter,
      processingMode: PROCESSING_MODES.browser,
      status: "success",
    });

    await expect(history.validate()).rejects.toMatchObject({
      errors: {
        accountId: expect.anything(),
        sessionId: expect.anything(),
      },
    });
  });

  it("rejects invalid operation type, processing mode, and status values", async () => {
    const history = new HistorySchemaSpecModel({
      sessionId: "guest-session-1",
      operationType: "enhance_manual",
      processingMode: "offline",
      status: "queued",
    });

    await expect(history.validate()).rejects.toMatchObject({
      errors: {
        operationType: expect.anything(),
        processingMode: expect.anything(),
        status: expect.anything(),
      },
    });
  });
});
