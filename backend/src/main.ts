import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";
  const port = Number(process.env.PORT ?? 4000);

  app.useBodyParser("json", { limit: "14mb" });
  app.useBodyParser("urlencoded", { extended: true, limit: "14mb" });
  app.setGlobalPrefix("api/v1");
  app.enableCors({
    origin: corsOrigin.split(",").map((origin) => origin.trim()),
  });

  await app.listen(port);
}

void bootstrap();
