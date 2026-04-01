import "server-only";
import pino from "pino";

// Raise listener limit to avoid MaxListenersExceededWarning from pino-pretty
if (process.env.NODE_ENV === "development") {
  process.stdout.setMaxListeners(50);
  process.stderr.setMaxListeners(50);
}

// Cache across HMR reloads — same pattern as lib/db.ts (Prisma singleton)
const globalForLogger = globalThis as unknown as {
  __logger: ReturnType<typeof pino> | undefined;
};

const logger =
  globalForLogger.__logger ??
  pino({
    level: process.env.LOG_LEVEL ?? "info",
    ...(process.env.NODE_ENV === "development" && {
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    }),
  });

if (process.env.NODE_ENV !== "production") globalForLogger.__logger = logger;

export default logger;
