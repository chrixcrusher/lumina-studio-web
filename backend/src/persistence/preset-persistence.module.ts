import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Preset, PresetSchema } from "./mongodb/schemas/preset.schema";
import { PresetRepository } from "./repositories/preset.repository";

@Module({
  imports: [MongooseModule.forFeature([{ name: Preset.name, schema: PresetSchema }])],
  providers: [PresetRepository],
  exports: [PresetRepository],
})
export class PresetPersistenceModule {}
