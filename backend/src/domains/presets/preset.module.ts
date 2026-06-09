import { Module } from "@nestjs/common";
import { PresetPersistenceModule } from "../../persistence/preset-persistence.module";
import { AuthModule } from "../auth/auth.module";
import { PresetController } from "./preset.controller";
import { PresetService } from "./preset.service";

@Module({
  imports: [PresetPersistenceModule, AuthModule],
  controllers: [PresetController],
  providers: [PresetService],
  exports: [PresetService],
})
export class PresetModule {}
