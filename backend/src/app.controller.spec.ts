import { describe, expect, it, vi } from "vitest";
import { AppController } from "./app.controller";
import { AppService, AppStatus } from "./app.service";

describe("AppController", () => {
  it("returns the app status from the root and health endpoints", () => {
    const status: AppStatus = {
      name: "LuminaStudio Web API",
      status: "ok",
      checks: {
        databaseConfigured: true,
        frontendOriginsConfigured: true,
        maxUploadSizeMb: 10,
        providerGeneratedUrlsSupported: true,
      },
    };
    const appService = {
      getStatus: vi.fn().mockReturnValue(status),
    } as unknown as AppService;
    const controller = new AppController(appService);

    expect(controller.getStatus()).toBe(status);
    expect(controller.getHealth()).toBe(status);
    expect(appService.getStatus).toHaveBeenCalledTimes(2);
  });
});
