import { Injectable } from "@nestjs/common";

export type AppStatus = {
  name: "LuminaStudio Web API";
  status: "ok";
};

@Injectable()
export class AppService {
  getStatus(): AppStatus {
    return {
      name: "LuminaStudio Web API",
      status: "ok",
    };
  }
}
