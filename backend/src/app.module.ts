import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AccountModule } from "./domains/account/account.module";
import { AuthModule } from "./domains/auth/auth.module";
import { PresetModule } from "./domains/presets/preset.module";

const mongodbUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/lumina-studio-web";

@Module({
  imports: [MongooseModule.forRoot(mongodbUri), AuthModule, AccountModule, PresetModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
