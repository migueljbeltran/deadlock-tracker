import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface HealthCheck {
  status: "ok" | "error";
  latency_ms?: number;
  error?: string;
}

export async function GET() {
  const checks: Record<string, HealthCheck> = {
    app: { status: "ok" },
  };

  // Database check
  try {
    const start = Date.now();
    await prisma.$queryRawUnsafe("SELECT 1");
    checks.database = { status: "ok", latency_ms: Date.now() - start };
  } catch (err) {
    checks.database = {
      status: "error",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }

  // Deadlock API check
  try {
    const start = Date.now();
    const res = await fetch("https://assets.deadlock-api.com/v2/heroes", {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    checks.deadlock_api = {
      status: res.ok ? "ok" : "error",
      latency_ms: Date.now() - start,
      ...(res.ok ? {} : { error: `HTTP ${res.status}` }),
    };
  } catch (err) {
    checks.deadlock_api = {
      status: "error",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }

  const allOk = Object.values(checks).every((c) => c.status === "ok");
  const appOk = checks.app.status === "ok";
  const status = allOk ? "healthy" : appOk ? "degraded" : "unhealthy";

  return NextResponse.json(
    { status, timestamp: new Date().toISOString(), checks },
    { status: allOk || appOk ? 200 : 503 },
  );
}
