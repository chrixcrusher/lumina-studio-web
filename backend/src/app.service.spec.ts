import { describe, expect, it } from "vitest";
import { AppService } from "./app.service";

describe("AppService", () => {
  it("returns a safe deployment smoke status", () => {
    const service = new AppService({
      FRONTEND_URL: "https://lumina-web.vercel.app",
      MAX_UPLOAD_SIZE_MB: "8",
      MONGODB_URI: "mongodb+srv://example",
    });

    expect(service.getStatus()).toEqual({
      name: "LuminaStudio Web API",
      status: "ok",
      checks: {
        databaseConfigured: true,
        frontendOriginsConfigured: true,
        maxUploadSizeMb: 8,
        providerGeneratedUrlsSupported: true,
      },
    });
    expect(JSON.stringify(service.getStatus())).not.toContain("mongodb+srv://example");
  });
});
