import "server-only";

import type { GlobalPlayerMetricsBenchmark } from "@/lib/api";
import { cacheGet } from "@/lib/cache";
import logger from "@/lib/logger";

const PLAYER_METRICS_BENCHMARK_KEY = "player-metrics-benchmark:v1";
const BENCHMARK_FRESHNESS_SECONDS = 86400;

function isBenchmarkStale(benchmark: GlobalPlayerMetricsBenchmark): boolean {
  const fetchedAt = Date.parse(benchmark.fetchedAt);
  if (Number.isNaN(fetchedAt)) return true;
  return (Date.now() - fetchedAt) / 1000 >= BENCHMARK_FRESHNESS_SECONDS;
}

export async function getLatestGlobalPlayerMetricsBenchmark(): Promise<GlobalPlayerMetricsBenchmark | null> {
  const benchmark = await cacheGet<GlobalPlayerMetricsBenchmark>(PLAYER_METRICS_BENCHMARK_KEY);
  if (!benchmark) {
    logger.debug("Global player metrics benchmark missing");
    return null;
  }

  logger.info({ stale: isBenchmarkStale(benchmark), fetchedAt: benchmark.fetchedAt }, "Global player metrics benchmark loaded");
  return benchmark;
}
