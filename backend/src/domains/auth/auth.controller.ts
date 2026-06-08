import { Body, Controller, Get, HttpCode, Post, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import type {
  AuthenticatedRequest,
  AuthResponseDto,
  CurrentUserResponseDto,
  LoginRequestDto,
  LogoutResponseDto,
  RegisterRequestDto,
} from "./auth.types";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  @HttpCode(201)
  register(@Body() body: RegisterRequestDto): Promise<AuthResponseDto> {
    return this.auth.register(body);
  }

  @Post("login")
  @HttpCode(200)
  login(@Body() body: LoginRequestDto): Promise<AuthResponseDto> {
    return this.auth.login(body);
  }

  @Post("logout")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  logout(): LogoutResponseDto {
    return this.auth.logout();
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest): Promise<CurrentUserResponseDto> {
    if (!request.user) {
      throw new UnauthorizedException("Authorization bearer token is required.");
    }

    return this.auth.getCurrentUser(request.user.accountId);
  }
}
