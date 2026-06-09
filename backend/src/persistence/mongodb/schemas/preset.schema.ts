import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema } from "mongoose";
import { Account } from "./account.schema";

export const PRESET_COLLECTION = "presets";

export type PresetEnhancementSettings = Record<string, unknown>;

@Schema({
  collection: PRESET_COLLECTION,
  timestamps: true,
  versionKey: false,
})
export class Preset {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Account.name,
    required: true,
    index: true,
  })
  accountId!: string;

  @Prop({ type: String, required: true, trim: true })
  presetName!: string;

  @Prop({ type: Object, required: true })
  enhancementSettings!: PresetEnhancementSettings;

  createdAt!: Date;

  updatedAt!: Date;
}

export type PresetDocument = HydratedDocument<Preset>;

export const PresetSchema = SchemaFactory.createForClass(Preset);

PresetSchema.index({ accountId: 1, presetName: 1 }, { unique: true });
PresetSchema.index({ accountId: 1, createdAt: -1 });
