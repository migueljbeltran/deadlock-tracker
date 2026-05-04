import "server-only";

type ServerEnvKey =
  | "DATABASE_URL"
  | "STEAM_API_KEY"
  | "UPSTASH_REDIS_REST_URL"
  | "UPSTASH_REDIS_REST_TOKEN"
  | "SENTRY_AUTH_TOKEN"
  | "LOG_LEVEL";

export function getOptionalServerEnv(key: ServerEnvKey): string | undefined {
  const value = process.env[key]?.trim();
  return value && value.length > 0 ? value : undefined;
}

export function getRequiredServerEnv(key: ServerEnvKey): string {
  const value = getOptionalServerEnv(key);
  if (!value) {
    throw new Error(`${key} environment variable is not set.`);
  }
  return value;
}

