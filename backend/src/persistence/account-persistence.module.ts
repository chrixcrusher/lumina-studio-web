import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Account, AccountSchema } from "./mongodb/schemas/account.schema";
import { AccountRepository } from "./repositories/account.repository";

@Module({
  imports: [MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }])],
  providers: [AccountRepository],
  exports: [AccountRepository],
})
export class AccountPersistenceModule {}
