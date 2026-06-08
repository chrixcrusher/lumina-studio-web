import { Injectable } from "@nestjs/common";
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

const SCRYPT_ALGORITHM = "scrypt";
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const PASSWORD_KEY_LENGTH = 64;

@Injectable()
export class AuthPasswordService {
  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("base64url");
    const derivedKey = await this.deriveKey(password, salt, PASSWORD_KEY_LENGTH, this.scryptOptions());

    return [
      SCRYPT_ALGORITHM,
      SCRYPT_COST,
      SCRYPT_BLOCK_SIZE,
      SCRYPT_PARALLELIZATION,
      salt,
      derivedKey.toString("base64url"),
    ].join("$");
  }

  async verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    const parsedHash = this.parseHash(passwordHash);

    if (!parsedHash) {
      return false;
    }

    const derivedKey = await this.deriveKey(password, parsedHash.salt, parsedHash.keyLength, {
      cost: parsedHash.cost,
      blockSize: parsedHash.blockSize,
      parallelization: parsedHash.parallelization,
    });

    if (derivedKey.length !== parsedHash.storedKey.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, parsedHash.storedKey);
  }

  private parseHash(passwordHash: string):
    | {
        salt: string;
        storedKey: Buffer;
        keyLength: number;
        cost: number;
        blockSize: number;
        parallelization: number;
      }
    | null {
    const [algorithm, costValue, blockSizeValue, parallelizationValue, salt, storedKeyValue] =
      passwordHash.split("$");

    if (algorithm !== SCRYPT_ALGORITHM || !salt || !storedKeyValue) {
      return null;
    }

    const cost = Number(costValue);
    const blockSize = Number(blockSizeValue);
    const parallelization = Number(parallelizationValue);
    const storedKey = Buffer.from(storedKeyValue, "base64url");

    if (
      !Number.isInteger(cost) ||
      !Number.isInteger(blockSize) ||
      !Number.isInteger(parallelization) ||
      storedKey.length === 0
    ) {
      return null;
    }

    return {
      salt,
      storedKey,
      keyLength: storedKey.length,
      cost,
      blockSize,
      parallelization,
    };
  }

  private scryptOptions(): ScryptOptions {
    return {
      cost: SCRYPT_COST,
      blockSize: SCRYPT_BLOCK_SIZE,
      parallelization: SCRYPT_PARALLELIZATION,
    };
  }

  private deriveKey(
    password: string,
    salt: string,
    keyLength: number,
    options: ScryptOptions,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      scrypt(password, salt, keyLength, options, (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      });
    });
  }
}
