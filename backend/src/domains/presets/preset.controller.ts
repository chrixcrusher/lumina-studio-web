import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PresetService } from "./preset.service";
import type {
  CreatePresetRequestDto,
  DeletePresetResponseDto,
  ExportPresetResponseDto,
  ImportPresetRequestDto,
  PresetListResponseDto,
  PresetResponseDto,
  UpdatePresetRequestDto,
} from "./preset.types";

@Controller("presets")
@UseGuards(JwtAuthGuard)
export class PresetController {
  constructor(private readonly presets: PresetService) {}

  @Get()
  listPresets(@Req() request: AuthenticatedRequest): Promise<PresetListResponseDto> {
    return this.presets.listPresets(this.requireAccountId(request));
  }

  @Post()
  @HttpCode(201)
  createPreset(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreatePresetRequestDto,
  ): Promise<PresetResponseDto> {
    return this.presets.createPreset(this.requireAccountId(request), body);
  }

  @Put(":id")
  @HttpCode(200)
  updatePreset(
    @Req() request: AuthenticatedRequest,
    @Param("id") presetId: string,
    @Body() body: UpdatePresetRequestDto,
  ): Promise<PresetResponseDto> {
    return this.presets.updatePreset(this.requireAccountId(request), presetId, body);
  }

  @Delete(":id")
  @HttpCode(200)
  deletePreset(
    @Req() request: AuthenticatedRequest,
    @Param("id") presetId: string,
  ): Promise<DeletePresetResponseDto> {
    return this.presets.deletePreset(this.requireAccountId(request), presetId);
  }

  @Post("import")
  @HttpCode(201)
  importPreset(
    @Req() request: AuthenticatedRequest,
    @Body() body: ImportPresetRequestDto,
  ): Promise<PresetResponseDto> {
    return this.presets.importPreset(this.requireAccountId(request), body);
  }

  @Get(":id/export")
  exportPreset(
    @Req() request: AuthenticatedRequest,
    @Param("id") presetId: string,
  ): Promise<ExportPresetResponseDto> {
    return this.presets.exportPreset(this.requireAccountId(request), presetId);
  }

  private requireAccountId(request: AuthenticatedRequest): string {
    if (!request.user) {
      throw new UnauthorizedException("Authorization bearer token is required.");
    }

    return request.user.accountId;
  }
}
