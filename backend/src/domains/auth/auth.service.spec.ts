import { BadRequestException, ConflictException, UnauthorizedException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountDocument } from "../../persistence/mongodb/schemas/account.schema";
import { AccountRepository, CreateAccountInput } from "../../persistence/repositories/account.repository";
import { AuthPasswordService } from "./auth-password.service";
import { AuthTokenService } from "./auth-token.service";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  const createdAt = new Date("2026-01-01T00:00:00.000Z");
  const updatedAt = new Date("2026-01-02T00:00:00.000Z");

  let accounts: {
    create: ReturnType<typeof vi.fn>;
    findByEmail: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
  };
  let passwords: AuthPasswordService;
  let tokens: AuthTokenService;
  let service: AuthService;
  let existingAccount: AccountDocument;

  beforeEach(async () => {
    passwords = new AuthPasswordService();
    tokens = AuthTokenService.createForTesting("test-secret");
    existingAccount = accountDocument({
      passwordHash: await passwords.hashPassword("SecurePassword123"),
    });

    accounts = {
      create: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn(),
    };
    service = new AuthService(accounts as unknown as AccountRepository, passwords, tokens);
  });

  it("registers a new account with a hashed password and JWT token", async () => {
    accounts.findByEmail.mockResolvedValue(null);
    accounts.create.mockImplementation(async (input: CreateAccountInput) =>
      accountDocument({
        email: input.email,
        passwordHash: input.passwordHash,
        displayName: input.displayName,
      }),
    );

    const response = await service.register({
      email: " USER@Example.COM ",
      password: "SecurePassword123",
      displayName: " Christian ",
    });

    const createInput = accounts.create.mock.calls[0][0] as CreateAccountInput;

    expect(accounts.findByEmail).toHaveBeenCalledWith("user@example.com");
    expect(createInput.passwordHash).not.toBe("SecurePassword123");
    await expect(passwords.verifyPassword("SecurePassword123", createInput.passwordHash)).resolves.toBe(true);
    expect(response).toMatchObject({
      success: true,
      message: "Account registered successfully",
      account: {
        id: "account-1",
        email: "user@example.com",
        displayName: "Christian",
        huggingFaceTokenConfigured: false,
      },
      token: expect.any(String),
    });
    expect(tokens.verify(response.token).accountId).toBe("account-1");
  });

  it("rejects duplicate registration emails", async () => {
    accounts.findByEmail.mockResolvedValue(existingAccount);

    await expect(
      service.register({
        email: "user@example.com",
        password: "SecurePassword123",
        displayName: "Christian",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("logs in existing users with valid credentials", async () => {
    accounts.findByEmail.mockResolvedValue(existingAccount);

    const response = await service.login({
      email: "USER@example.com",
      password: "SecurePassword123",
    });

    expect(response).toMatchObject({
      success: true,
      message: "Authentication successful",
      account: {
        id: "account-1",
        email: "user@example.com",
        displayName: "Christian",
      },
      token: expect.any(String),
    });
  });

  it("rejects unknown users and invalid passwords without exposing which field failed", async () => {
    accounts.findByEmail.mockResolvedValueOnce(null);

    await expect(
      service.login({
        email: "missing@example.com",
        password: "SecurePassword123",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    accounts.findByEmail.mockResolvedValueOnce(existingAccount);

    await expect(
      service.login({
        email: "user@example.com",
        password: "WrongPassword123",
      }),
    ).rejects.toMatchObject({
      message: "Invalid email or password.",
    });
  });

  it("returns the authenticated account profile without secret fields", async () => {
    accounts.findById.mockResolvedValue(existingAccount);

    await expect(service.getCurrentUser("account-1")).resolves.toEqual({
      success: true,
      account: {
        id: "account-1",
        email: "user@example.com",
        displayName: "Christian",
        huggingFaceTokenConfigured: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    });
  });

  it("uses field-specific validation errors for auth input", async () => {
    await expect(
      service.register({
        email: "not-an-email",
        password: "short",
        displayName: "",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.login({
        email: "user@example.com",
        password: "",
      }),
    ).rejects.toMatchObject({
      message: "Missing required field: password.",
    });
  });

  function accountDocument(overrides: Partial<AccountDocument> = {}): AccountDocument {
    return {
      id: "account-1",
      email: "user@example.com",
      passwordHash: "scrypt$hash",
      displayName: "Christian",
      huggingFaceTokenConfigured: false,
      createdAt,
      updatedAt,
      ...overrides,
    } as AccountDocument;
  }
});
