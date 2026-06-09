import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  PresetRepository,
  UpdatePresetInput,
} from "../../persistence/repositories/preset.repository";
import {
  PresetDocument,
  PresetEnhancementSettings,
} from "../../persistence/mongodb/schemas/preset.schema";
import type {
  CreatePresetRequestDto,
  DeletePresetResponseDto,
  ExportPresetResponseDto,
  ImportPresetRequestDto,
  PresetDto,
  PresetListResponseDto,
  PresetResponseDto,
  UpdatePresetRequestDto,
} from "./preset.types";

@Injectable()
export class PresetService {
  constructor(private readonly presets: PresetRepository) {}

  async listPresets(accountId: string): Promise<PresetListResponseDto> {
    const presets = await this.presets.findByAccountId(accountId);

    return {
      success: true,
      presets: presets.map((preset) => this.toPresetDto(preset)),
    };
  }

  async createPreset(
    accountId: string,
    input: CreatePresetRequestDto,
  ): Promise<PresetResponseDto> {
    const presetInput = this.validatePresetInput(input);

    try {
      const preset = await this.presets.create({
        accountId,
        ...presetInput,
      });

      return {
        success: true,
        message: "Preset created",
        preset: this.toPresetDto(preset),
      };
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async updatePreset(
    accountId: string,
    presetId: string,
    input: UpdatePresetRequestDto,
  ): Promise<PresetResponseDto> {
    this.validatePresetId(presetId);
    const update = this.validatePresetUpdate(input);

    try {
      const preset = await this.presets.updateByIdForAccount(accountId, presetId, update);

      if (!preset) {
        throw new NotFoundException("Preset not found.");
      }

      return {
        success: true,
        message: "Preset updated",
        preset: this.toPresetDto(preset),
      };
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async deletePreset(accountId: string, presetId: string): Promise<DeletePresetResponseDto> {
    this.validatePresetId(presetId);

    try {
      const deleted = await this.presets.deleteByIdForAccount(accountId, presetId);

      if (!deleted) {
        throw new NotFoundException("Preset not found.");
      }

      return {
        success: true,
        message: "Preset deleted",
      };
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async importPreset(
    accountId: string,
    input: ImportPresetRequestDto,
  ): Promise<PresetResponseDto> {
    const presetInput = this.validatePresetInput(input);

    try {
      const preset = await this.presets.create({
        accountId,
        ...presetInput,
      });

      return {
        success: true,
        message: "Preset imported",
        preset: this.toPresetDto(preset),
      };
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async exportPreset(accountId: string, presetId: string): Promise<ExportPresetResponseDto> {
    this.validatePresetId(presetId);

    try {
      const preset = await this.presets.findByIdForAccount(accountId, presetId);

      if (!preset) {
        throw new NotFoundException("Preset not found.");
      }

      return {
        presetName: preset.presetName,
        enhancementSettings: preset.enhancementSettings,
      };
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  private validatePresetInput(input: CreatePresetRequestDto): {
    presetName: string;
    enhancementSettings: PresetEnhancementSettings;
  } {
    return {
      presetName: this.requirePresetName(input.presetName),
      enhancementSettings: this.requireEnhancementSettings(input.enhancementSettings),
    };
  }

  private validatePresetUpdate(input: UpdatePresetRequestDto): UpdatePresetInput {
    const update: UpdatePresetInput = {};

    if (input.presetName !== undefined) {
      update.presetName = this.requirePresetName(input.presetName);
    }

    if (input.enhancementSettings !== undefined) {
      update.enhancementSettings = this.requireEnhancementSettings(input.enhancementSettings);
    }

    if (Object.keys(update).length === 0) {
      throw new BadRequestException(
        "Missing required field: presetName or enhancementSettings.",
      );
    }

    return update;
  }

  private requirePresetName(value: unknown): string {
    if (typeof value !== "string") {
      throw new BadRequestException("Missing required field: presetName.");
    }

    const presetName = value.trim();

    if (presetName.length === 0) {
      throw new BadRequestException("Missing required field: presetName.");
    }

    return presetName;
  }

  private requireEnhancementSettings(value: unknown): PresetEnhancementSettings {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new BadRequestException("Missing required field: enhancementSettings.");
    }

    return value as PresetEnhancementSettings;
  }

  private validatePresetId(value: string): void {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new BadRequestException("Missing required field: id.");
    }
  }

  private toPresetDto(preset: PresetDocument): PresetDto {
    return {
      id: preset.id,
      presetName: preset.presetName,
      enhancementSettings: preset.enhancementSettings,
      createdAt: this.toIsoString(preset.createdAt),
      updatedAt: this.toIsoString(preset.updatedAt),
    };
  }

  private toIsoString(value: Date | string): string {
    return value instanceof Date ? value.toISOString() : value;
  }

  private handlePersistenceError(error: unknown): never {
    if (error instanceof BadRequestException || error instanceof NotFoundException) {
      throw error;
    }

    if (this.isDuplicatePresetNameError(error)) {
      throw new ConflictException("Preset name already exists for this account.");
    }

    if (this.isInvalidPresetIdError(error)) {
      throw new NotFoundException("Preset not found.");
    }

    throw error;
  }

  private isDuplicatePresetNameError(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    );
  }

  private isInvalidPresetIdError(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "CastError"
    );
  }
}
