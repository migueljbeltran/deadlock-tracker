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
    vi.spyOn(Date, "now").mockReturnValue(60_000);
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

  it("falls back to bounded local limiting when Redis rejects writes", async () => {
    const error = new Error("DB capacity quota exceeded");
    limitMock.mockRejectedValue(error);

    const { checkRateLimit } = await import("@/lib/ratelimit");

    await expect(checkRateLimit("search", "127.0.0.1")).resolves.toEqual({
      success: true,
      reset: 120_000,
    });
    for (let i = 1; i < 10; i++) await checkRateLimit("search", "127.0.0.1");
    await expect(checkRateLimit("search", "127.0.0.1")).resolves.toEqual({ success: false, reset: 120_000 });
    expect(limitMock).toHaveBeenCalledTimes(1);
    expect(loggerWarn).toHaveBeenCalledWith(
      { name: "search" },
      "Redis rate limiting unavailable; using per-instance fallback",
    );
  });

  it("handles SDK timeout responses instead of accepting their fail-open result", async () => {
    limitMock.mockResolvedValue({ success: true, reason: "timeout", reset: 0 });
    const { checkRateLimit } = await import("@/lib/ratelimit");
    for (let i = 0; i < 10; i++) await checkRateLimit("search", "ip");
    expect((await checkRateLimit("search", "ip")).success).toBe(false);
    vi.mocked(Date.now).mockReturnValue(90_000);
    limitMock.mockResolvedValue({ success: false, reset: 123_000 });
    await expect(checkRateLimit("search", "ip")).resolves.toEqual({ success: false, reset: 123_000 });
    expect(limitMock).toHaveBeenCalledTimes(2);
  });

  it("limits without Redis credentials, isolates endpoints and identifiers, and resets the window", async () => {
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const { checkRateLimit } = await import("@/lib/ratelimit");
    for (let i = 0; i < 10; i++) await checkRateLimit("search", "ip");
    expect((await checkRateLimit("search", "ip")).success).toBe(false);
    expect((await checkRateLimit("search", "another-ip")).success).toBe(true);
    expect((await checkRateLimit("playerApi", "ip")).success).toBe(true);
    vi.mocked(Date.now).mockReturnValue(120_000);
    await expect(checkRateLimit("search", "ip")).resolves.toEqual({ success: true, reset: 180_000 });
    expect(limitMock).not.toHaveBeenCalled();
  });

  it("rejects new identifiers when fallback storage is full without resetting existing counters", async () => {
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const { checkRateLimit } = await import("@/lib/ratelimit");
    for (let i = 0; i < 10_000; i++) await checkRateLimit("search", `ip-${i}`);
    expect((await checkRateLimit("search", "overflow-ip")).success).toBe(false);
    expect((await checkRateLimit("search", "ip-0")).success).toBe(true);
    vi.mocked(Date.now).mockReturnValue(120_000);
    expect((await checkRateLimit("search", "overflow-ip")).success).toBe(true);
  });
});
