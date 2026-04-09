import "server-only";

import type { GlobalPlayerMetricsBenchmark } from "@/lib/api";
import { cacheGet } from "@/lib/cache";
import logger from "@/lib/logger";

const PLAYER_METRICS_BENCHMARK_KEY = "player-metrics-benchmark:v1";

// Per-process memo — the benchmark is global (not per-player) and updated at
// most daily by an external job, so it's safe to pin for 5 minutes per Fluid
// instance. This eliminates a Redis GET on every /api/player cache miss.
const BENCHMARK_MEMO_TTL_MS = 5 * 60 * 1000;
let memoValue: GlobalPlayerMetricsBenchmark | null = null;
let memoExpiry = 0;

export async function getLatestGlobalPlayerMetricsBenchmark(): Promise<GlobalPlayerMetricsBenchmark | null> {
  if (memoValue && Date.now() < memoExpiry) {
    return memoValue;
  }

  const benchmark = await cacheGet<GlobalPlayerMetricsBenchmark>(PLAYER_METRICS_BENCHMARK_KEY);
  if (!benchmark) {
    logger.debug("Global player metrics benchmark missing");
    return null;
  }

  memoValue = benchmark;
  memoExpiry = Date.now() + BENCHMARK_MEMO_TTL_MS;
  logger.debug({ fetchedAt: benchmark.fetchedAt }, "Global player metrics benchmark loaded");
  return benchmark;
}
