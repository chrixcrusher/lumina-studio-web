import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { ACCOUNT_FIELD_NAMES } from "../../../contracts/lumina";

export const ACCOUNT_COLLECTION = "accounts";

@Schema({
  collection: ACCOUNT_COLLECTION,
  timestamps: true,
  versionKey: false,
})
export class Account {
  @Prop({
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "email must be a valid email address"],
  })
  email!: string;

  @Prop({ type: String, required: true })
  passwordHash!: string;

  @Prop({ type: String, required: true, trim: true })
  displayName!: string;

  @Prop({ type: String, required: false, select: false })
  encryptedHuggingFaceToken?: string;

  @Prop({ type: Boolean, required: true, default: false })
  huggingFaceTokenConfigured!: boolean;

  createdAt!: Date;

  updatedAt!: Date;
}

export type AccountDocument = HydratedDocument<Account>;

export const AccountSchema = SchemaFactory.createForClass(Account);

AccountSchema.index({ email: 1 }, { unique: true });

for (const canonicalFieldName of Object.values(ACCOUNT_FIELD_NAMES)) {
  if (!AccountSchema.path(canonicalFieldName)) {
    throw new Error(`Account schema is missing canonical field: ${canonicalFieldName}`);
  }
}
