import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { AccountDocument } from "../../persistence/mongodb/schemas/account.schema";
import { AccountRepository, CreateAccountInput } from "../../persistence/repositories/account.repository";
import { AuthPasswordService } from "./auth-password.service";
import { AuthTokenService } from "./auth-token.service";
import type {
  AccountProfileDto,
  AccountSummaryDto,
  AuthResponseDto,
  CurrentUserResponseDto,
  LoginRequestDto,
  LogoutResponseDto,
  RegisterRequestDto,
} from "./auth.types";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const MINIMUM_PASSWORD_LENGTH = 8;
const MINIMUM_DISPLAY_NAME_LENGTH = 2;

@Injectable()
export class AuthService {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly passwords: AuthPasswordService,
    private readonly tokens: AuthTokenService,
  ) {}

  async register(input: RegisterRequestDto): Promise<AuthResponseDto> {
    const email = this.validateEmail(input.email);
    const password = this.validatePassword(input.password);
    const displayName = this.validateDisplayName(input.displayName);

    const existingAccount = await this.accounts.findByEmail(email);

    if (existingAccount) {
      throw new ConflictException("An account with this email already exists.");
    }

    const createInput: CreateAccountInput = {
      email,
      passwordHash: await this.passwords.hashPassword(password),
      displayName,
    };

    try {
      const account = await this.accounts.create(createInput);
      return this.toAuthResponse("Account registered successfully", account);
    } catch (error) {
      if (isDuplicateEmailError(error)) {
        throw new ConflictException("An account with this email already exists.");
      }

      throw error;
    }
  }

  async login(input: LoginRequestDto): Promise<AuthResponseDto> {
    const email = this.validateEmail(input.email);
    const password = this.validatePassword(input.password);
    const account = await this.accounts.findByEmail(email);

    if (!account) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    const passwordMatches = await this.passwords.verifyPassword(password, account.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    return this.toAuthResponse("Authentication successful", account);
  }

  logout(): LogoutResponseDto {
    return {
      success: true,
      message: "Logged out successfully",
    };
  }

  async getCurrentUser(accountId: string): Promise<CurrentUserResponseDto> {
    const account = await this.accounts.findById(accountId);

    if (!account) {
      throw new UnauthorizedException("Authenticated account was not found.");
    }

    return {
      success: true,
      account: this.toAccountProfile(account),
    };
  }

  private toAuthResponse(message: string, account: AccountDocument): AuthResponseDto {
    const summary = this.toAccountSummary(account);

    return {
      success: true,
      message,
      account: summary,
      token: this.tokens.sign(summary),
    };
  }

  private toAccountSummary(account: AccountDocument): AccountSummaryDto {
    return {
      id: account.id,
      email: account.email,
      displayName: account.displayName,
      huggingFaceTokenConfigured: account.huggingFaceTokenConfigured,
    };
  }

  private toAccountProfile(account: AccountDocument): AccountProfileDto {
    return {
      ...this.toAccountSummary(account),
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    };
  }

  private validateEmail(value: unknown): string {
    const email = this.requireString(value, "email").toLowerCase();

    if (!EMAIL_PATTERN.test(email)) {
      throw new BadRequestException("Invalid field: email must be a valid email address.");
    }

    return email;
  }

  private validatePassword(value: unknown): string {
    const password = this.requireString(value, "password", { trim: false });

    if (password.length < MINIMUM_PASSWORD_LENGTH) {
      throw new BadRequestException("Invalid field: password must be at least 8 characters.");
    }

    return password;
  }

  private validateDisplayName(value: unknown): string {
    const displayName = this.requireString(value, "displayName");

    if (displayName.length < MINIMUM_DISPLAY_NAME_LENGTH) {
      throw new BadRequestException("Invalid field: displayName must be at least 2 characters.");
    }

    return displayName;
  }

  private requireString(value: unknown, fieldName: string, options: { trim?: boolean } = {}): string {
    if (typeof value !== "string") {
      throw new BadRequestException(`Missing required field: ${fieldName}.`);
    }

    const normalizedValue = options.trim === false ? value : value.trim();

    if (normalizedValue.length === 0) {
      throw new BadRequestException(`Missing required field: ${fieldName}.`);
    }

    return normalizedValue;
  }
}

function isDuplicateEmailError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}
