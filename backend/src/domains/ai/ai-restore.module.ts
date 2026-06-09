import { Module } from "@nestjs/common";
import { HuggingFaceModule } from "../../integrations/huggingface/hugging-face.module";
import { AccountPersistenceModule } from "../../persistence/account-persistence.module";
import { AccountModule } from "../account/account.module";
import { AuthModule } from "../auth/auth.module";
import { HistoryModule } from "../history/history.module";
import { AiRestoreController } from "./ai-restore.controller";
import { AiRestoreService } from "./ai-restore.service";

@Module({
  imports: [HuggingFaceModule, HistoryModule, AuthModule, AccountModule, AccountPersistenceModule],
  controllers: [AiRestoreController],
  providers: [AiRestoreService],
})
export class AiRestoreModule {}
