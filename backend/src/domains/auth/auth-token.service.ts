import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { AccountSummaryDto, AuthTokenPayload } from "./auth.types";

const JWT_ALGORITHM = "HS256";
const JWT_TYPE = "JWT";
const AUTH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
const LOCAL_JWT_SECRET = "lumina-studio-web-local-jwt-secret";

interface JwtClaims {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly jwtSecret = resolveJwtSecret(),
    private readonly tokenTtlSeconds = AUTH_TOKEN_TTL_SECONDS,
  ) {}

  sign(account: Pick<AccountSummaryDto, "id" | "email">): string {
    const issuedAt = Math.floor(Date.now() / 1000);
    const claims: JwtClaims = {
      sub: account.id,
      email: account.email,
      iat: issuedAt,
      exp: issuedAt + this.tokenTtlSeconds,
    };

    const header = base64UrlEncodeJson({ alg: JWT_ALGORITHM, typ: JWT_TYPE });
    const payload = base64UrlEncodeJson(claims);
    const signature = this.signParts(header, payload);

    return `${header}.${payload}.${signature}`;
  }

  verify(token: string): AuthTokenPayload {
    const [header, payload, signature] = token.split(".");

    if (!header || !payload || !signature || token.split(".").length !== 3) {
      throw new UnauthorizedException("Authorization bearer token is invalid.");
    }

    const expectedSignature = this.signParts(header, payload);

    if (!constantTimeEquals(signature, expectedSignature)) {
      throw new UnauthorizedException("Authorization bearer token is invalid.");
    }

    const claims = parseClaims(payload);
    const now = Math.floor(Date.now() / 1000);

    if (claims.exp <= now) {
      throw new UnauthorizedException("Authorization bearer token has expired.");
    }

    return {
      accountId: claims.sub,
      email: claims.email,
      exp: claims.exp,
    };
  }

  private signParts(header: string, payload: string): string {
    return createHmac("sha256", this.jwtSecret).update(`${header}.${payload}`).digest("base64url");
  }
}

function resolveJwtSecret(): string {
  const configuredSecret = process.env.JWT_SECRET?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production.");
  }

  return LOCAL_JWT_SECRET;
}

function parseClaims(payload: string): JwtClaims {
  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as Partial<JwtClaims>;

    if (
      typeof parsed.sub !== "string" ||
      parsed.sub.length === 0 ||
      typeof parsed.email !== "string" ||
      parsed.email.length === 0 ||
      typeof parsed.exp !== "number"
    ) {
      throw new Error("Invalid JWT claims.");
    }

    return {
      sub: parsed.sub,
      email: parsed.email,
      iat: typeof parsed.iat === "number" ? parsed.iat : 0,
      exp: parsed.exp,
    };
  } catch {
    throw new UnauthorizedException("Authorization bearer token is invalid.");
  }
}

function base64UrlEncodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function constantTimeEquals(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}
