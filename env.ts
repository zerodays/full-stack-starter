import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

// Use Bun.env if available, otherwise fall back to process.env (for CLI tools like better-auth)
const runtimeEnv =
  typeof Bun !== "undefined" ? Bun.env : (process.env as Record<string, string | undefined>);

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
    SERVICE_VERSION: z.string().default("dev"),
  },

  // TODO: client secrets

  runtimeEnvStrict: {
    APP_NAME: runtimeEnv.APP_NAME,
    ENV: runtimeEnv.ENV,
    LOG_LEVEL: runtimeEnv.LOG_LEVEL,
    SENTRY_DSN: runtimeEnv.SENTRY_DSN,
    DATABASE_URL: runtimeEnv.DATABASE_URL,
    BETTER_AUTH_SECRET: runtimeEnv.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: runtimeEnv.BETTER_AUTH_URL,
    AXIOM_TOKEN: runtimeEnv.AXIOM_TOKEN,
    AXIOM_DATASET: runtimeEnv.AXIOM_DATASET,
    OTEL_SERVICE_NAME: runtimeEnv.OTEL_SERVICE_NAME,
    SERVICE_VERSION: runtimeEnv.SERVICE_VERSION,
  },
});
export default env;
