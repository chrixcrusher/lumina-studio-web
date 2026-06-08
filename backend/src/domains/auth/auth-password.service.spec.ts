import { describe, expect, it } from "vitest";
import { AuthPasswordService } from "./auth-password.service";

describe("AuthPasswordService", () => {
  const service = new AuthPasswordService();

  it("hashes passwords without storing the plain value", async () => {
    const hash = await service.hashPassword("SecurePassword123");

    expect(hash).not.toBe("SecurePassword123");
    expect(hash.startsWith("scrypt$")).toBe(true);
    await expect(service.verifyPassword("SecurePassword123", hash)).resolves.toBe(true);
  });

  it("rejects incorrect or unsupported password hashes", async () => {
    const hash = await service.hashPassword("SecurePassword123");

    await expect(service.verifyPassword("WrongPassword123", hash)).resolves.toBe(false);
    await expect(service.verifyPassword("SecurePassword123", "$2b$10$legacyHash")).resolves.toBe(false);
  });
});
