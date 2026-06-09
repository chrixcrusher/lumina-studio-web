import { Injectable } from "@nestjs/common";
import { getDeploymentConfig } from "./common/deployment-config";

export type AppStatus = {
  name: "LuminaStudio Web API";
  status: "ok";
  checks: {
    databaseConfigured: boolean;
    frontendOriginsConfigured: boolean;
    maxUploadSizeMb: number;
    providerGeneratedUrlsSupported: true;
  };
};

@Injectable()
export class AppService {
  constructor(private readonly env: NodeJS.ProcessEnv = process.env) {}

  getStatus(): AppStatus {
    const config = getDeploymentConfig(this.env);

    return {
      name: "LuminaStudio Web API",
      status: "ok",
      checks: {
        databaseConfigured: Boolean(config.mongodbUri),
        frontendOriginsConfigured: config.frontendOrigins.length > 0,
        maxUploadSizeMb: config.maxUploadSizeMb,
        providerGeneratedUrlsSupported: true,
      },
    };
  }
}
