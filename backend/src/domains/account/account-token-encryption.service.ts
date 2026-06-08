import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const CIPHER_ALGORITHM = "aes-256-gcm";
const IV_BYTE_LENGTH = 12;
const TOKEN_FORMAT_VERSION = "v1";
const LOCAL_TOKEN_ENCRYPTION_KEY = "lumina-studio-web-local-token-encryption-key";

@Injectable()
export class HuggingFaceTokenEncryptionService {
  private readonly encryptionKey = resolveTokenEncryptionKey();

  encrypt(plainToken: string): string {
    const iv = randomBytes(IV_BYTE_LENGTH);
    const cipher = createCipheriv(CIPHER_ALGORITHM, this.deriveKey(), iv);
    const encryptedToken = Buffer.concat([cipher.update(plainToken, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [
      TOKEN_FORMAT_VERSION,
      iv.toString("base64url"),
      authTag.toString("base64url"),
      encryptedToken.toString("base64url"),
    ].join(":");
  }

  decrypt(encryptedToken: string): string {
    const [version, ivValue, authTagValue, encryptedValue] = encryptedToken.split(":");

    if (
      version !== TOKEN_FORMAT_VERSION ||
      !ivValue ||
      !authTagValue ||
      !encryptedValue ||
      encryptedToken.split(":").length !== 4
    ) {
      throw new InternalServerErrorException("Saved Hugging Face token could not be read.");
    }

    try {
      const decipher = createDecipheriv(
        CIPHER_ALGORITHM,
        this.deriveKey(),
        Buffer.from(ivValue, "base64url"),
      );
      decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));

      return Buffer.concat([
        decipher.update(Buffer.from(encryptedValue, "base64url")),
        decipher.final(),
      ]).toString("utf8");
    } catch {
      throw new InternalServerErrorException("Saved Hugging Face token could not be read.");
    }
  }

  private deriveKey(): Buffer {
    return createHash("sha256").update(this.encryptionKey).digest();
  }
}

function resolveTokenEncryptionKey(): string {
  const configuredKey = process.env.TOKEN_ENCRYPTION_KEY?.trim();

  if (configuredKey) {
    return configuredKey;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("TOKEN_ENCRYPTION_KEY must be configured in production.");
  }

  return LOCAL_TOKEN_ENCRYPTION_KEY;
}
