import { describe, expect, it, vi } from "vitest";
import { createRateLimitMiddleware, RateLimitedRequest } from "./rate-limit.middleware";

describe("rate limit middleware", () => {
  it("limits repeated requests by client and route with a safe response", () => {
    let now = 1_000;
    const middleware = createRateLimitMiddleware({
      maxRequests: 2,
      now: () => now,
      windowMs: 1_000,
    });
    const request: RateLimitedRequest = {
      headers: {
        "x-forwarded-for": "203.0.113.10",
      },
      method: "POST",
      originalUrl: "/api/v1/ai/restore-face",
    };
    const next = vi.fn();
    const json = vi.fn();
    const response = {
      status: vi.fn().mockReturnValue({ json }),
    };

    middleware(request, response, next);
    middleware(request, response, next);
    middleware(request, response, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(response.status).toHaveBeenCalledWith(429);
    expect(json).toHaveBeenCalledWith({
      message: "Too many requests. Please try again later.",
      statusCode: 429,
    });
    expect(JSON.stringify(json.mock.calls)).not.toContain("hf_");

    now = 2_001;
    middleware(request, response, next);

    expect(next).toHaveBeenCalledTimes(3);
  });
});
