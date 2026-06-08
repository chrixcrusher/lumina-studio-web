import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";
  const port = Number(process.env.PORT ?? 4000);

  app.setGlobalPrefix("api/v1");
  app.enableCors({
    origin: corsOrigin.split(",").map((origin) => origin.trim()),
  });

  await app.listen(port);
}

void bootstrap();
