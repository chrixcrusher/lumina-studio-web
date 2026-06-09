import { Body, Controller, Headers, HttpCode, Post, Req } from "@nestjs/common";
import { AuthTokenService } from "../auth/auth-token.service";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { AiRestoreService } from "./ai-restore.service";
import type {
  RestoreFaceOwnerDto,
  RestoreFaceRequestDto,
  RestoreFaceResponseDto,
} from "./ai-restore.types";

@Controller("ai")
export class AiRestoreController {
  constructor(
    private readonly restore: AiRestoreService,
    private readonly tokens: AuthTokenService,
  ) {}

  @Post("restore-face")
  @HttpCode(200)
  restoreFace(
    @Req() request: AuthenticatedRequest,
    @Headers("x-session-id") sessionId: string | string[] | undefined,
    @Body() body: RestoreFaceRequestDto,
  ): Promise<RestoreFaceResponseDto> {
    return this.restore.restoreFace(this.resolveOwner(request, sessionId), body);
  }

  private resolveOwner(
    request: AuthenticatedRequest,
    sessionId: string | string[] | undefined,
  ): RestoreFaceOwnerDto {
    const bearerToken = this.extractBearerToken(request);

    if (bearerToken) {
      return {
        accountId: this.tokens.verify(bearerToken).accountId,
      };
    }

    const headerSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId;

    return {
      sessionId: headerSessionId,
    };
  }

  private extractBearerToken(request: AuthenticatedRequest): string | null {
    const authorization = request.headers.authorization ?? request.headers.Authorization;
    const header = Array.isArray(authorization) ? authorization[0] : authorization;

    if (!header) {
      return null;
    }

    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return null;
    }

    return token;
  }
}
