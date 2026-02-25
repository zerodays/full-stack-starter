// IMPORTANT: Instrumentation must be first to patch modules before they're loaded
import "@/server/lib/instrumentation";

import { httpInstrumentationMiddleware } from "@hono/otel";
import * as Sentry from "@sentry/bun";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import env from "@/env";
import { authFeature } from "@/server/features/auth";
import { demo } from "@/server/features/demo";
import { health } from "@/server/features/health";
import { otel } from "@/server/features/otel";
import { createRouter } from "@/server/lib/router";
import {
  authMiddleware,
  sessionMiddleware,
} from "@/server/middleware/auth.middleware";
import { dbMiddleware } from "@/server/middleware/db.middleware";

// First, init Sentry to capture errors
Sentry.init({
  dsn: env.SENTRY_DSN,
  sendDefaultPii: true,
});

// Public API routes (no auth required)
const publicApi = new Hono()
  .route("/auth", authFeature)
  .route("/health", health);

// Protected API routes (auth + db middleware)
const protectedApi = createRouter()
  .use(sessionMiddleware)
  .use(authMiddleware)
  .use(dbMiddleware)
  .route("/", demo);

// API routes that will be traced and exposed via RPC
const api = new Hono().route("/", publicApi).route("/", protectedApi);

const app = new Hono()
  // OTel proxy must be BEFORE tracing middleware (avoids recursive tracing)
  .route("/api/otel", otel)
  // OpenTelemetry Middleware - traces all requests after this point
  .use(httpInstrumentationMiddleware())
  // Traced API routes - mounted AFTER middleware
  .route("/api", api);

// Static file serving and SPA fallback
const isProd = env.ENV !== "development";

if (isProd) {
  app.use(
    "*",
    serveStatic({
      root: "./dist-static",
      rewriteRequestPath: (requestPath) => {
        if (requestPath === "/") return "/index.html";
        if (requestPath.includes(".")) return requestPath;
        return `${requestPath}.html`;
      },
    }),
  );
}

// SPA fallback: serve index.html for any unmatched routes
app.get("*", async (c) => {
  const html = await Bun.file(
    isProd ? "./dist-static/index.html" : "./index.html",
  ).text();
  return c.html(html);
});

// Export type for Hono RPC client
export type AppType = typeof api;

export default app;
