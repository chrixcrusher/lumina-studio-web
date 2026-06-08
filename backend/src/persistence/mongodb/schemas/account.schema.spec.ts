import { model } from "mongoose";
import { describe, expect, it } from "vitest";
import { ACCOUNT_FIELD_NAMES } from "../../../contracts/lumina";
import { ACCOUNT_COLLECTION, Account, AccountSchema } from "./account.schema";

const AccountSchemaSpecModel = model<Account>("AccountSchemaSpec", AccountSchema.clone());

describe("AccountSchema", () => {
  it("uses the canonical accounts collection and timestamps", () => {
    expect(AccountSchema.options.collection).toBe(ACCOUNT_COLLECTION);
    expect(AccountSchema.options.timestamps).toBe(true);
  });

  it("defines the unique email index", () => {
    const hasUniqueEmailIndex = AccountSchema.indexes().some(([fields, options]) => {
      return fields.email === 1 && options.unique === true;
    });

    expect(hasUniqueEmailIndex).toBe(true);
  });

  it("validates required account fields and defaults token status to false", async () => {
    const account = new AccountSchemaSpecModel({
      email: " USER@Example.COM ",
      passwordHash: "$2b$10$hashedPasswordValue",
      displayName: "Christian",
    });

    await expect(account.validate()).resolves.toBeUndefined();
    expect(account.email).toBe("user@example.com");
    expect(account.huggingFaceTokenConfigured).toBe(false);
  });

  it("rejects invalid account records", async () => {
    const account = new AccountSchemaSpecModel({
      email: "not-an-email",
    });

    await expect(account.validate()).rejects.toMatchObject({
      errors: {
        email: expect.anything(),
        passwordHash: expect.anything(),
        displayName: expect.anything(),
      },
    });
  });

  it("keeps encrypted Hugging Face token fields canonical and hidden by default", () => {
    const encryptedTokenPath = AccountSchema.path(ACCOUNT_FIELD_NAMES.encryptedHuggingFaceToken);
    const tokenStatusPath = AccountSchema.path(ACCOUNT_FIELD_NAMES.huggingFaceTokenConfigured);

    expect(encryptedTokenPath?.options.select).toBe(false);
    expect(tokenStatusPath?.options.required).toBe(true);
    expect(tokenStatusPath?.options.default).toBe(false);
  });
});
