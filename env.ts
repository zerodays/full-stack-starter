import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const env = createEnv({
  server: {
    APP_NAME: z.string().min(1),
    ENV: z.enum(["development", "staging", "production"]),
    SENTRY_DSN: z.string().url().optional(),
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url(),
  },

  // TODO: client secrets

  runtimeEnvStrict: {
    APP_NAME: Bun.env.APP_NAME,
    ENV: Bun.env.ENV,
    SENTRY_DSN: Bun.env.SENTRY_DSN,
    DATABASE_URL: Bun.env.DATABASE_URL,
    BETTER_AUTH_SECRET: Bun.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: Bun.env.BETTER_AUTH_URL,
  },
});
export default env;
