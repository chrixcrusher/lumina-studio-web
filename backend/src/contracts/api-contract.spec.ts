import "reflect-metadata";
import { RequestMethod } from "@nestjs/common";
import { METHOD_METADATA, PATH_METADATA } from "@nestjs/common/constants";
import { describe, expect, it } from "vitest";
import { AccountController } from "../domains/account/account.controller";
import { AiRestoreController } from "../domains/ai/ai-restore.controller";
import { AuthController } from "../domains/auth/auth.controller";
import { HistoryController } from "../domains/history/history.controller";
import { PresetController } from "../domains/presets/preset.controller";

const controllerMethods = [
  { controller: AuthController, methods: ["register", "login", "logout", "me"] },
  { controller: AccountController, methods: ["saveHuggingFaceToken", "deleteHuggingFaceToken"] },
  { controller: AiRestoreController, methods: ["restoreFace"] },
  { controller: HistoryController, methods: ["listHistory", "createHistory", "deleteHistory"] },
  { controller: PresetController, methods: ["listPresets", "createPreset", "updatePreset", "deletePreset", "importPreset", "exportPreset"] },
] as const;

describe("MVP API contract", () => {
  it("exposes the canonical documented API routes", () => {
    expect(routeContracts()).toEqual([
      "POST /api/v1/auth/register",
      "POST /api/v1/auth/login",
      "POST /api/v1/auth/logout",
      "GET /api/v1/auth/me",
      "PUT /api/v1/account/hugging-face-token",
      "DELETE /api/v1/account/hugging-face-token",
      "POST /api/v1/ai/restore-face",
      "GET /api/v1/history",
      "POST /api/v1/history",
      "DELETE /api/v1/history/:id",
      "GET /api/v1/presets",
      "POST /api/v1/presets",
      "PUT /api/v1/presets/:id",
      "DELETE /api/v1/presets/:id",
      "POST /api/v1/presets/import",
      "GET /api/v1/presets/:id/export",
    ]);
  });

  it("does not expose non-MVP backend image enhancement routes", () => {
    expect(routeContracts()).not.toContain("POST /api/v1/enhance/offline");
    expect(routeContracts()).not.toContain("POST /api/v1/enhance/manual");
  });
});

function routeContracts() {
  return controllerMethods.flatMap(({ controller, methods }) => {
    const controllerPath = readPath(Reflect.getMetadata(PATH_METADATA, controller));

    return methods.map((methodName) => {
      const method = (controller.prototype as unknown as Record<string, object>)[methodName];
      const methodPath = readPath(Reflect.getMetadata(PATH_METADATA, method));
      const requestMethod = Reflect.getMetadata(METHOD_METADATA, method) as RequestMethod;

      return `${RequestMethod[requestMethod]} ${joinRoute("/api/v1", controllerPath, methodPath)}`;
    });
  });
}

function readPath(path: unknown) {
  if (Array.isArray(path)) {
    return String(path[0] ?? "");
  }

  return String(path ?? "");
}

function joinRoute(...parts: string[]) {
  const route = parts
    .map((part) => part.replace(/^\/+|\/+$/g, ""))
    .filter((part) => part.length > 0)
    .join("/")

  return `/${route}`;
}
