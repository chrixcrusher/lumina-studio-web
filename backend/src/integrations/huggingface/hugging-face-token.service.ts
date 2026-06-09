import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";

const MINIMUM_HUGGING_FACE_TOKEN_LENGTH = 8;

@Injectable()
export class HuggingFaceTokenService {
  requireRequestToken(value: unknown, fieldName = "huggingFaceToken"): string {
    if (typeof value !== "string") {
      throw new UnauthorizedException(`Missing required field: ${fieldName}.`);
    }

    return this.validateToken(value, fieldName);
  }

  optionalRequestToken(value: unknown, fieldName = "huggingFaceToken"): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    return this.validateToken(value, fieldName);
  }

  createAuthorizationHeader(huggingFaceToken: string): string {
    return `Bearer ${this.validateToken(huggingFaceToken, "huggingFaceToken")}`;
  }

  private validateToken(value: unknown, fieldName: string): string {
    if (typeof value !== "string") {
      throw new BadRequestException(`Invalid field: ${fieldName}.`);
    }

    const token = value.trim();

    if (!token.startsWith("hf_") || token.length < MINIMUM_HUGGING_FACE_TOKEN_LENGTH) {
      throw new BadRequestException(
        `Invalid field: ${fieldName} must be a Hugging Face API token.`,
      );
    }

    return token;
  }
}
