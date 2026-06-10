import { describe, expect, it } from "vitest";
import { buildCorsOptions, getDeploymentConfig } from "./deployment-config";

describe("deployment config", () => {
  it("reads provider-generated frontend URLs and upload limits from env", () => {
    const config = getDeploymentConfig({
      FRONTEND_URL: "https://lumina-web.vercel.app, https://preview.pages.dev/",
      MAX_UPLOAD_SIZE_MB: "7",
      MONGODB_URI: "mongodb+srv://example",
      PORT: "5000",
      RATE_LIMIT_MAX_REQUESTS: "12",
      RATE_LIMIT_WINDOW_MS: "30000",
    });

    expect(config).toMatchObject({
      bodyParserLimit: "7mb",
      frontendOrigins: ["https://lumina-web.vercel.app", "https://preview.pages.dev"],
      maxUploadSizeBytes: 7 * 1024 * 1024,
      mongodbUri: "mongodb+srv://example",
      port: 5000,
      rateLimit: {
        maxRequests: 12,
        windowMs: 30_000,
      },
    });
  });

  it("fails fast when production deployment secrets are missing", () => {
    expect(() =>
      getDeploymentConfig({
        FRONTEND_URL: "https://lumina-web.vercel.app",
        NODE_ENV: "production",
      }),
    ).toThrow(
      "Missing required deployment environment variables: MONGODB_URI, JWT_SECRET, TOKEN_ENCRYPTION_KEY.",
    );
  });

  it("fails fast on hosted deployments even when NODE_ENV is not production", () => {
    expect(() =>
      getDeploymentConfig({
        FRONTEND_URL: "https://lumina-web.onrender.com",
        RENDER: "true",
      }),
    ).toThrow(
      "Missing required deployment environment variables: MONGODB_URI, JWT_SECRET, TOKEN_ENCRYPTION_KEY.",
    );
  });

  it("rejects local MongoDB URIs on hosted deployments", () => {
    expect(() =>
      getDeploymentConfig({
        FRONTEND_URL: "https://lumina-web.onrender.com",
        JWT_SECRET: "replace-with-host-secret",
        MONGODB_URI: "mongodb://127.0.0.1:27017/lumina-studio-web",
        RENDER: "true",
        TOKEN_ENCRYPTION_KEY: "replace-with-host-encryption-key",
      }),
    ).toThrow("MONGODB_URI must point to MongoDB Atlas or another hosted MongoDB service in deployment.");
  });

  it("allows only configured browser origins through CORS", async () => {
    const cors = buildCorsOptions(
      getDeploymentConfig({
        FRONTEND_URL: "https://lumina-web.vercel.app",
      }),
    );

    await expect(
      new Promise<boolean>((resolve, reject) => {
        cors.origin("https://lumina-web.vercel.app", (error, allowed) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(Boolean(allowed));
        });
      }),
    ).resolves.toBe(true);

    await expect(
      new Promise<boolean>((resolve, reject) => {
        cors.origin("https://attacker.example", (error, allowed) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(Boolean(allowed));
        });
      }),
    ).rejects.toThrow("Origin is not allowed");
  });
});
