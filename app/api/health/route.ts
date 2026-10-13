import { NextRequest, NextResponse } from "next/server";
import { checkRequestRateLimit, rateLimitResponse } from "@/lib/ratelimit";

interface HealthCheck {
  status: "ok" | "error";
  latency_ms?: number;
  error?: string;
}

export async function GET(request: NextRequest) {
  const { success: allowed, reset } = await checkRequestRateLimit(request, "healthApi");
  if (!allowed) return rateLimitResponse(reset);

  const checks: Record<string, HealthCheck> = {
    app: { status: "ok" },
  };

  // Deadlock API check
  try {
    const start = Date.now();
    const res = await fetch("https://api.deadlock-api.com/v1/assets/heroes", {
      method: "HEAD",
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    checks.deadlock_api = {
      status: res.ok ? "ok" : "error",
      latency_ms: Date.now() - start,
      ...(res.ok ? {} : { error: `HTTP ${res.status}` }),
    };
  } catch {
    checks.deadlock_api = {
      status: "error",
      error: "Service unavailable",
    };
  }

  const allOk = Object.values(checks).every((c) => c.status === "ok");
  const appOk = checks.app.status === "ok";
  const status = allOk ? "healthy" : appOk ? "degraded" : "unhealthy";

  const httpStatus = allOk || appOk ? 200 : 503;
  return NextResponse.json(
    { status, timestamp: new Date().toISOString(), checks },
    {
      status: httpStatus,
      // Cache healthy responses for 60s so uptime monitors share the API probe.
      // Never cache degraded/unhealthy — monitors need to see recovery immediately.
      headers: allOk
        ? { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" }
        : { "Cache-Control": "no-store" },
    },
  );
}
