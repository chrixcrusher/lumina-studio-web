import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AccountService } from "./account.service";
import type {
  HuggingFaceTokenStatusResponseDto,
  SaveHuggingFaceTokenRequestDto,
} from "./account.types";

@Controller("account")
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Put("hugging-face-token")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  saveHuggingFaceToken(
    @Req() request: AuthenticatedRequest,
    @Body() body: SaveHuggingFaceTokenRequestDto,
  ): Promise<HuggingFaceTokenStatusResponseDto> {
    return this.account.saveHuggingFaceToken(this.requireAccountId(request), body);
  }

  @Delete("hugging-face-token")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  deleteHuggingFaceToken(
    @Req() request: AuthenticatedRequest,
  ): Promise<HuggingFaceTokenStatusResponseDto> {
    return this.account.deleteHuggingFaceToken(this.requireAccountId(request));
  }

  private requireAccountId(request: AuthenticatedRequest): string {
    if (!request.user) {
      throw new UnauthorizedException("Authorization bearer token is required.");
    }

    return request.user.accountId;
  }
}
