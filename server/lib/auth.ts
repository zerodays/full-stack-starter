import { dash } from "@better-auth/infra";
import { instrumentBetterAuth } from "@kubiks/otel-better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import env from "@/env";
import { db } from "@/server/database";
import * as schema from "@/server/database/schema";

export const auth = instrumentBetterAuth(
  betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    plugins: [
      admin(),
      dash({
        apiKey: env.BETTER_AUTH_API_KEY,
        activityTracking: {
          enabled: true,
        },
      }),
    ],
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: env.AUTH_COOKIE_MAX_AGE_SECONDS,
      },
    },
  }),
);
