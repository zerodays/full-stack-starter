import { instrumentBetterAuth } from "@kubiks/otel-better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import env from "@/env";
import { db } from "@/server/database";
import * as schema from "@/server/database/schema";

export const auth = instrumentBetterAuth(
  betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // 5 minutes
      },
    },
  }),
);
