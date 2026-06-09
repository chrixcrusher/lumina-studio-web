import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { buildCorsOptions, getDeploymentConfig } from "./common/deployment-config";
import { createRateLimitMiddleware } from "./common/rate-limit.middleware";
import { SafeLogger } from "./common/safe-logger";

async function bootstrap(): Promise<void> {
  const config = getDeploymentConfig();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    logger: new SafeLogger(),
  });
  const rateLimit = createRateLimitMiddleware(config.rateLimit);

  app.set("trust proxy", 1);
  app.enableCors(buildCorsOptions(config));
  app.useBodyParser("json", { limit: config.bodyParserLimit });
  app.useBodyParser("urlencoded", { extended: true, limit: config.bodyParserLimit });
  app.use("/api/v1/auth", rateLimit);
  app.use("/api/v1/ai/restore-face", rateLimit);
  app.setGlobalPrefix("api/v1");

  await app.listen(config.port);
}

void bootstrap();
