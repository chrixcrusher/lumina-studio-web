interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  maxRequests: number;
  now?: () => number;
  windowMs: number;
}

export interface RateLimitedRequest {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  method?: string;
  originalUrl?: string;
  socket?: {
    remoteAddress?: string;
  };
  url?: string;
}

export interface RateLimitedResponse {
  status(code: number): {
    json(body: { message: string; statusCode: number }): unknown;
  };
}

export type RateLimitNext = () => void;

export function createRateLimitMiddleware(options: RateLimitOptions) {
  const requests = new Map<string, RateLimitEntry>();
  const now = options.now ?? Date.now;

  return (
    request: RateLimitedRequest,
    response: RateLimitedResponse,
    next: RateLimitNext,
  ): void => {
    const timestamp = now();
    const key = buildRateLimitKey(request);
    const current = requests.get(key);
    const entry =
      current && current.resetAt > timestamp
        ? current
        : {
            count: 0,
            resetAt: timestamp + options.windowMs,
          };

    entry.count += 1;
    requests.set(key, entry);

    if (entry.count > options.maxRequests) {
      response.status(429).json({
        message: "Too many requests. Please try again later.",
        statusCode: 429,
      });
      return;
    }

    next();
  };
}

function buildRateLimitKey(request: RateLimitedRequest): string {
  return [
    readClientIp(request),
    request.method ?? "UNKNOWN",
    request.originalUrl ?? request.url ?? "/",
  ].join(":");
}

function readClientIp(request: RateLimitedRequest): string {
  const forwardedFor = request.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;

  return forwardedIp?.split(",")[0]?.trim() || request.ip || request.socket?.remoteAddress || "unknown";
}
