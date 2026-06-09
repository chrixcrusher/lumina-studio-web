import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { HistoryPersistenceModule } from "../../persistence/history-persistence.module";
import { HistoryController } from "./history.controller";
import { HistoryService } from "./history.service";

@Module({
  imports: [HistoryPersistenceModule, AuthModule],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
