import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const env = createEnv({
  server: {
    APP_NAME: z.string().min(1),
    ENV: z.enum(["development", "staging", "production"]),
    LOG_LEVEL: z
      .enum(["trace", "debug", "info", "warn", "error", "fatal"])
      .default("info"),
    SENTRY_DSN: z.url().optional(),
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url(),
    AXIOM_TOKEN: z.string().min(1).optional(),
    AXIOM_DATASET: z.string().min(1).optional(),
    OTEL_SERVICE_NAME: z.string().default("server"),
    // Set via CI/CD: SERVICE_VERSION=$(git rev-parse --short HEAD)
    SERVICE_VERSION: z.string().default("dev"),
  },

  // TODO: client secrets

  runtimeEnvStrict: {
    APP_NAME: Bun.env.APP_NAME,
    ENV: Bun.env.ENV,
    LOG_LEVEL: Bun.env.LOG_LEVEL,
    SENTRY_DSN: Bun.env.SENTRY_DSN,
    DATABASE_URL: Bun.env.DATABASE_URL,
    BETTER_AUTH_SECRET: Bun.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: Bun.env.BETTER_AUTH_URL,
    AXIOM_TOKEN: Bun.env.AXIOM_TOKEN,
    AXIOM_DATASET: Bun.env.AXIOM_DATASET,
    OTEL_SERVICE_NAME: Bun.env.OTEL_SERVICE_NAME,
    SERVICE_VERSION: Bun.env.SERVICE_VERSION,
  },
});
export default env;
