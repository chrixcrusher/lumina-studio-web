import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ACCOUNT_FIELD_NAMES } from "../../contracts/lumina";
import { Account, AccountDocument } from "../mongodb/schemas/account.schema";

export interface CreateAccountInput {
  email: string;
  passwordHash: string;
  displayName: string;
  encryptedHuggingFaceToken?: string;
}

export interface UpdateAccountInput {
  email?: string;
  passwordHash?: string;
  displayName?: string;
}

export interface FindAccountOptions {
  includeEncryptedHuggingFaceToken?: boolean;
}

export interface HuggingFaceTokenStatus {
  accountId: string;
  huggingFaceTokenConfigured: boolean;
}

@Injectable()
export class AccountRepository {
  constructor(
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
  ) {}

  async create(input: CreateAccountInput): Promise<AccountDocument> {
    return this.accountModel.create({
      email: this.normalizeEmail(input.email),
      passwordHash: input.passwordHash,
      displayName: input.displayName,
      encryptedHuggingFaceToken: input.encryptedHuggingFaceToken,
      huggingFaceTokenConfigured: Boolean(input.encryptedHuggingFaceToken),
    });
  }

  async findById(accountId: string, options: FindAccountOptions = {}): Promise<AccountDocument | null> {
    const query = this.accountModel.findById(accountId);
    this.applyEncryptedTokenSelection(query, options);

    return query.exec();
  }

  async findByEmail(email: string, options: FindAccountOptions = {}): Promise<AccountDocument | null> {
    const query = this.accountModel.findOne({ email: this.normalizeEmail(email) });
    this.applyEncryptedTokenSelection(query, options);

    return query.exec();
  }

  async updateById(accountId: string, input: UpdateAccountInput): Promise<AccountDocument | null> {
    const update = this.buildAccountUpdate(input);

    if (Object.keys(update).length === 0) {
      return this.findById(accountId);
    }

    return this.accountModel
      .findByIdAndUpdate(accountId, { $set: update }, { new: true, runValidators: true })
      .exec();
  }

  async getHuggingFaceTokenStatus(accountId: string): Promise<HuggingFaceTokenStatus | null> {
    const account = await this.accountModel
      .findById(accountId)
      .select(ACCOUNT_FIELD_NAMES.huggingFaceTokenConfigured)
      .exec();

    return this.toHuggingFaceTokenStatus(account);
  }

  async saveEncryptedHuggingFaceToken(
    accountId: string,
    encryptedHuggingFaceToken: string,
  ): Promise<HuggingFaceTokenStatus | null> {
    const account = await this.accountModel
      .findByIdAndUpdate(
        accountId,
        {
          $set: {
            [ACCOUNT_FIELD_NAMES.encryptedHuggingFaceToken]: encryptedHuggingFaceToken,
            [ACCOUNT_FIELD_NAMES.huggingFaceTokenConfigured]: true,
          },
        },
        { new: true, runValidators: true },
      )
      .select(ACCOUNT_FIELD_NAMES.huggingFaceTokenConfigured)
      .exec();

    return this.toHuggingFaceTokenStatus(account);
  }

  async clearHuggingFaceToken(accountId: string): Promise<HuggingFaceTokenStatus | null> {
    const account = await this.accountModel
      .findByIdAndUpdate(
        accountId,
        {
          $unset: {
            [ACCOUNT_FIELD_NAMES.encryptedHuggingFaceToken]: "",
          },
          $set: {
            [ACCOUNT_FIELD_NAMES.huggingFaceTokenConfigured]: false,
          },
        },
        { new: true, runValidators: true },
      )
      .select(ACCOUNT_FIELD_NAMES.huggingFaceTokenConfigured)
      .exec();

    return this.toHuggingFaceTokenStatus(account);
  }

  private applyEncryptedTokenSelection(
    query: { select: (fields: string) => unknown },
    options: FindAccountOptions,
  ): void {
    if (options.includeEncryptedHuggingFaceToken) {
      query.select(`+${ACCOUNT_FIELD_NAMES.encryptedHuggingFaceToken}`);
    }
  }

  private buildAccountUpdate(input: UpdateAccountInput): Partial<Account> {
    const update: Partial<Account> = {};

    if (input.email !== undefined) {
      update.email = this.normalizeEmail(input.email);
    }

    if (input.passwordHash !== undefined) {
      update.passwordHash = input.passwordHash;
    }

    if (input.displayName !== undefined) {
      update.displayName = input.displayName;
    }

    return update;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private toHuggingFaceTokenStatus(account: AccountDocument | null): HuggingFaceTokenStatus | null {
    if (!account) {
      return null;
    }

    return {
      accountId: account.id,
      huggingFaceTokenConfigured: account.huggingFaceTokenConfigured,
    };
  }
}
