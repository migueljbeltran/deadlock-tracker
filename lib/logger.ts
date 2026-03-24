import "server-only";
import pino from "pino";

// Increase stream listener limit in dev to avoid MaxListenersExceededWarning
// from pino-pretty when parallel API calls produce concurrent log writes
if (process.env.NODE_ENV === "development") {
  process.stdout.setMaxListeners(20);
  process.stderr.setMaxListeners(20);
}

const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  ...(process.env.NODE_ENV === "development" && {
    transport: {
      target: "pino-pretty",
      options: { colorize: true },
    },
  }),
});

export default logger;
