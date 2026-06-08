import { Module } from "@nestjs/common";
import { AccountPersistenceModule } from "../../persistence/account-persistence.module";
import { AuthPasswordService } from "./auth-password.service";
import { AuthTokenService } from "./auth-token.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Module({
  imports: [AccountPersistenceModule],
  controllers: [AuthController],
  providers: [AuthService, AuthPasswordService, AuthTokenService, JwtAuthGuard],
  exports: [AuthService, AuthTokenService, JwtAuthGuard],
})
export class AuthModule {}
