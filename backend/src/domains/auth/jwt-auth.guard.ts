import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthTokenService } from "./auth-token.service";
import type { AuthenticatedRequest } from "./auth.types";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: AuthTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    request.user = this.tokens.verify(token);

    return true;
  }

  private extractBearerToken(request: AuthenticatedRequest): string {
    const authorization = request.headers.authorization ?? request.headers.Authorization;
    const header = Array.isArray(authorization) ? authorization[0] : authorization;

    if (!header) {
      throw new UnauthorizedException("Authorization bearer token is required.");
    }

    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Authorization bearer token is invalid.");
    }

    return token;
  }
}
