import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { History, HistorySchema } from "./mongodb/schemas/history.schema";
import { HistoryRepository } from "./repositories/history.repository";

@Module({
  imports: [MongooseModule.forFeature([{ name: History.name, schema: HistorySchema }])],
  providers: [HistoryRepository],
  exports: [HistoryRepository],
})
export class HistoryPersistenceModule {}
