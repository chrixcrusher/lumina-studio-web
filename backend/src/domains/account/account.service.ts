import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import {
  AccountRepository,
  HuggingFaceTokenStatus,
} from "../../persistence/repositories/account.repository";
import { HuggingFaceTokenEncryptionService } from "./account-token-encryption.service";
import type {
  HuggingFaceTokenStatusResponseDto,
  SaveHuggingFaceTokenRequestDto,
} from "./account.types";

const MINIMUM_HUGGING_FACE_TOKEN_LENGTH = 8;

@Injectable()
export class AccountService {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly tokenEncryption: HuggingFaceTokenEncryptionService,
  ) {}

  async saveHuggingFaceToken(
    accountId: string,
    input: SaveHuggingFaceTokenRequestDto,
  ): Promise<HuggingFaceTokenStatusResponseDto> {
    const huggingFaceToken = this.validateHuggingFaceToken(input.huggingFaceToken);
    const encryptedHuggingFaceToken = this.tokenEncryption.encrypt(huggingFaceToken);
    const status = await this.accounts.saveEncryptedHuggingFaceToken(
      accountId,
      encryptedHuggingFaceToken,
    );

    return this.toStatusResponse("Hugging Face token saved", status);
  }

  async deleteHuggingFaceToken(accountId: string): Promise<HuggingFaceTokenStatusResponseDto> {
    const status = await this.accounts.clearHuggingFaceToken(accountId);

    return this.toStatusResponse("Hugging Face token removed", status);
  }

  private validateHuggingFaceToken(value: unknown): string {
    const token = this.requireString(value, "huggingFaceToken");

    if (!token.startsWith("hf_") || token.length < MINIMUM_HUGGING_FACE_TOKEN_LENGTH) {
      throw new BadRequestException(
        "Invalid field: huggingFaceToken must be a Hugging Face API token.",
      );
    }

    return token;
  }

  private requireString(value: unknown, fieldName: string): string {
    if (typeof value !== "string") {
      throw new BadRequestException(`Missing required field: ${fieldName}.`);
    }

    const normalizedValue = value.trim();

    if (normalizedValue.length === 0) {
      throw new BadRequestException(`Missing required field: ${fieldName}.`);
    }

    return normalizedValue;
  }

  private toStatusResponse(
    message: string,
    status: HuggingFaceTokenStatus | null,
  ): HuggingFaceTokenStatusResponseDto {
    if (!status) {
      throw new UnauthorizedException("Authenticated account was not found.");
    }

    return {
      success: true,
      message,
      huggingFaceTokenConfigured: status.huggingFaceTokenConfigured,
    };
  }
}
