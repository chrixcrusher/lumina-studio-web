import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { getDeploymentConfig } from "./common/deployment-config";
import { AccountModule } from "./domains/account/account.module";
import { AiRestoreModule } from "./domains/ai/ai-restore.module";
import { AuthModule } from "./domains/auth/auth.module";
import { HistoryModule } from "./domains/history/history.module";
import { PresetModule } from "./domains/presets/preset.module";

const mongodbUri = getDeploymentConfig().mongodbUri;

@Module({
  imports: [
    MongooseModule.forRoot(mongodbUri),
    AuthModule,
    AccountModule,
    PresetModule,
    HistoryModule,
    AiRestoreModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
