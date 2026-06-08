import { describe, expect, it } from "vitest";
import { AppService } from "./app.service";

describe("AppService", () => {
  it("returns the backend shell status", () => {
    const service = new AppService();

    expect(service.getStatus()).toEqual({
      name: "LuminaStudio Web API",
      status: "ok",
    });
  });
});
