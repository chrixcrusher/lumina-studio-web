import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  Preset,
  PresetDocument,
  PresetEnhancementSettings,
} from "../mongodb/schemas/preset.schema";

export interface CreatePresetInput {
  accountId: string;
  presetName: string;
  enhancementSettings: PresetEnhancementSettings;
}

export interface UpdatePresetInput {
  presetName?: string;
  enhancementSettings?: PresetEnhancementSettings;
}

@Injectable()
export class PresetRepository {
  constructor(
    @InjectModel(Preset.name)
    private readonly presetModel: Model<PresetDocument>,
  ) {}

  async create(input: CreatePresetInput): Promise<PresetDocument> {
    return this.presetModel.create({
      accountId: input.accountId,
      presetName: input.presetName,
      enhancementSettings: input.enhancementSettings,
    });
  }

  async findByAccountId(accountId: string): Promise<PresetDocument[]> {
    return this.presetModel.find({ accountId }).sort({ createdAt: -1 }).exec();
  }

  async findByIdForAccount(accountId: string, presetId: string): Promise<PresetDocument | null> {
    return this.presetModel.findOne({ _id: presetId, accountId }).exec();
  }

  async updateByIdForAccount(
    accountId: string,
    presetId: string,
    input: UpdatePresetInput,
  ): Promise<PresetDocument | null> {
    const update = this.buildPresetUpdate(input);

    if (Object.keys(update).length === 0) {
      return this.findByIdForAccount(accountId, presetId);
    }

    return this.presetModel
      .findOneAndUpdate({ _id: presetId, accountId }, { $set: update }, { new: true, runValidators: true })
      .exec();
  }

  async deleteByIdForAccount(accountId: string, presetId: string): Promise<boolean> {
    const result = await this.presetModel.deleteOne({ _id: presetId, accountId }).exec();

    return result.deletedCount === 1;
  }

  private buildPresetUpdate(input: UpdatePresetInput): Partial<Preset> {
    const update: Partial<Preset> = {};

    if (input.presetName !== undefined) {
      update.presetName = input.presetName;
    }

    if (input.enhancementSettings !== undefined) {
      update.enhancementSettings = input.enhancementSettings;
    }

    return update;
  }
}
