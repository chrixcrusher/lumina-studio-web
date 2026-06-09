import { Body, Controller, Delete, Get, Headers, HttpCode, Param, Post, Query, Req } from "@nestjs/common";
import { AuthTokenService } from "../auth/auth-token.service";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { HistoryService } from "./history.service";
import type {
  CreateHistoryRequestDto,
  CreateHistoryResponseDto,
  DeleteHistoryResponseDto,
  HistoryListQueryDto,
  HistoryListResponseDto,
  HistoryOwnerDto,
} from "./history.types";

@Controller("history")
export class HistoryController {
  constructor(
    private readonly history: HistoryService,
    private readonly tokens: AuthTokenService,
  ) {}

  @Get()
  listHistory(
    @Req() request: AuthenticatedRequest,
    @Headers("x-session-id") sessionId: string | string[] | undefined,
    @Query() query: HistoryListQueryDto,
  ): Promise<HistoryListResponseDto> {
    return this.history.listHistory(this.resolveOwner(request, sessionId), query);
  }

  @Post()
  @HttpCode(201)
  createHistory(
    @Req() request: AuthenticatedRequest,
    @Headers("x-session-id") sessionId: string | string[] | undefined,
    @Body() body: CreateHistoryRequestDto,
  ): Promise<CreateHistoryResponseDto> {
    return this.history.createHistory(this.resolveOwner(request, sessionId), body);
  }

  @Delete(":id")
  @HttpCode(200)
  deleteHistory(
    @Req() request: AuthenticatedRequest,
    @Headers("x-session-id") sessionId: string | string[] | undefined,
    @Param("id") historyId: string,
  ): Promise<DeleteHistoryResponseDto> {
    return this.history.deleteHistory(this.resolveOwner(request, sessionId), historyId);
  }

  private resolveOwner(
    request: AuthenticatedRequest,
    sessionId: string | string[] | undefined,
  ): HistoryOwnerDto {
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
