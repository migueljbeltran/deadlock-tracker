import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { limitMock, loggerWarn } = vi.hoisted(() => ({
  limitMock: vi.fn(),
  loggerWarn: vi.fn(),
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow = vi.fn().mockReturnValue("limiter");

    limit = limitMock;
  },
}));

vi.mock("@upstash/redis", () => ({
  Redis: class {},
}));

vi.mock("@/lib/logger", () => ({
  default: {
    warn: loggerWarn,
  },
}));

describe("checkRateLimit", () => {
  beforeEach(() => {
    limitMock.mockReset();
    loggerWarn.mockReset();
    vi.resetModules();
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
  });

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.restoreAllMocks();
  });

  it("returns the Redis rate-limit result when Redis is healthy", async () => {
    limitMock.mockResolvedValue({ success: false, reset: 12345 });

    const { checkRateLimit } = await import("@/lib/ratelimit");

    await expect(checkRateLimit("search", "127.0.0.1")).resolves.toEqual({
      success: false,
      reset: 12345,
    });
  });

  it("fails open when Redis rejects the rate-limit write", async () => {
    const error = new Error("DB capacity quota exceeded");
    limitMock.mockRejectedValue(error);

    const { checkRateLimit } = await import("@/lib/ratelimit");

    await expect(checkRateLimit("playerApi", "127.0.0.1")).resolves.toEqual({
      success: true,
    });
    expect(loggerWarn).toHaveBeenCalledWith(
      { error, name: "playerApi" },
      "Rate limit check failed; allowing request",
    );
  });
});
