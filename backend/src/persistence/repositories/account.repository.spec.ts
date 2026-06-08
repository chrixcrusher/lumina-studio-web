import { Model } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ACCOUNT_FIELD_NAMES } from "../../contracts/lumina";
import { AccountDocument } from "../mongodb/schemas/account.schema";
import { AccountRepository } from "./account.repository";

type MockQuery = {
  select: ReturnType<typeof vi.fn>;
  exec: ReturnType<typeof vi.fn>;
};

const createQuery = <T>(value: T): MockQuery => ({
  select: vi.fn().mockReturnThis(),
  exec: vi.fn().mockResolvedValue(value),
});

describe("AccountRepository", () => {
  const accountDocument = {
    id: "account-1",
    email: "user@example.com",
    passwordHash: "$2b$10$hashedPasswordValue",
    displayName: "Christian",
    huggingFaceTokenConfigured: true,
  } as AccountDocument;

  let accountModel: {
    create: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    findByIdAndUpdate: ReturnType<typeof vi.fn>;
  };
  let repository: AccountRepository;

  beforeEach(() => {
    accountModel = {
      create: vi.fn(),
      findById: vi.fn(),
      findOne: vi.fn(),
      findByIdAndUpdate: vi.fn(),
    };

    repository = new AccountRepository(accountModel as unknown as Model<AccountDocument>);
  });

  it("creates accounts with normalized email and token status derived from encrypted token presence", async () => {
    accountModel.create.mockResolvedValue(accountDocument);

    await expect(
      repository.create({
        email: " USER@Example.COM ",
        passwordHash: "$2b$10$hashedPasswordValue",
        displayName: "Christian",
      }),
    ).resolves.toBe(accountDocument);

    expect(accountModel.create).toHaveBeenCalledWith({
      email: "user@example.com",
      passwordHash: "$2b$10$hashedPasswordValue",
      displayName: "Christian",
      encryptedHuggingFaceToken: undefined,
      huggingFaceTokenConfigured: false,
    });
  });

  it("finds accounts by normalized email and can opt into encrypted token selection", async () => {
    const query = createQuery(accountDocument);
    accountModel.findOne.mockReturnValue(query);

    await expect(
      repository.findByEmail(" USER@Example.COM ", {
        includeEncryptedHuggingFaceToken: true,
      }),
    ).resolves.toBe(accountDocument);

    expect(accountModel.findOne).toHaveBeenCalledWith({ email: "user@example.com" });
    expect(query.select).toHaveBeenCalledWith(`+${ACCOUNT_FIELD_NAMES.encryptedHuggingFaceToken}`);
  });

  it("updates account profile fields with validation enabled", async () => {
    const query = createQuery(accountDocument);
    accountModel.findByIdAndUpdate.mockReturnValue(query);

    await expect(
      repository.updateById("account-1", {
        email: " NEW@Example.COM ",
        displayName: "New Name",
      }),
    ).resolves.toBe(accountDocument);

    expect(accountModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "account-1",
      {
        $set: {
          email: "new@example.com",
          displayName: "New Name",
        },
      },
      { new: true, runValidators: true },
    );
  });

  it("returns token status without selecting the encrypted token", async () => {
    const query = createQuery(accountDocument);
    accountModel.findById.mockReturnValue(query);

    await expect(repository.getHuggingFaceTokenStatus("account-1")).resolves.toEqual({
      accountId: "account-1",
      huggingFaceTokenConfigured: true,
    });

    expect(query.select).toHaveBeenCalledWith(ACCOUNT_FIELD_NAMES.huggingFaceTokenConfigured);
  });

  it("saves encrypted Hugging Face tokens and turns on the safe status flag", async () => {
    const query = createQuery(accountDocument);
    accountModel.findByIdAndUpdate.mockReturnValue(query);

    await expect(repository.saveEncryptedHuggingFaceToken("account-1", "encrypted-token")).resolves.toEqual({
      accountId: "account-1",
      huggingFaceTokenConfigured: true,
    });

    expect(accountModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "account-1",
      {
        $set: {
          [ACCOUNT_FIELD_NAMES.encryptedHuggingFaceToken]: "encrypted-token",
          [ACCOUNT_FIELD_NAMES.huggingFaceTokenConfigured]: true,
        },
      },
      { new: true, runValidators: true },
    );
    expect(query.select).toHaveBeenCalledWith(ACCOUNT_FIELD_NAMES.huggingFaceTokenConfigured);
  });

  it("clears encrypted Hugging Face tokens and turns off the safe status flag", async () => {
    const query = createQuery({
      ...accountDocument,
      huggingFaceTokenConfigured: false,
    } as AccountDocument);
    accountModel.findByIdAndUpdate.mockReturnValue(query);

    await expect(repository.clearHuggingFaceToken("account-1")).resolves.toEqual({
      accountId: "account-1",
      huggingFaceTokenConfigured: false,
    });

    expect(accountModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "account-1",
      {
        $unset: {
          [ACCOUNT_FIELD_NAMES.encryptedHuggingFaceToken]: "",
        },
        $set: {
          [ACCOUNT_FIELD_NAMES.huggingFaceTokenConfigured]: false,
        },
      },
      { new: true, runValidators: true },
    );
    expect(query.select).toHaveBeenCalledWith(ACCOUNT_FIELD_NAMES.huggingFaceTokenConfigured);
  });
});
