import { Module } from "@nestjs/common";
import { AccountPersistenceModule } from "../../persistence/account-persistence.module";
import { AuthModule } from "../auth/auth.module";
import { HuggingFaceTokenEncryptionService } from "./account-token-encryption.service";
import { AccountController } from "./account.controller";
import { AccountService } from "./account.service";

@Module({
  imports: [AccountPersistenceModule, AuthModule],
  controllers: [AccountController],
  providers: [AccountService, HuggingFaceTokenEncryptionService],
  exports: [AccountService, HuggingFaceTokenEncryptionService],
})
export class AccountModule {}
