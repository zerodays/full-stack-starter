// IMPORTANT: Instrumentation must be first to patch modules before they're loaded
import "@/server/instrumentation";

import { httpInstrumentationMiddleware } from "@hono/otel";
import * as Sentry from "@sentry/bun";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import env from "@/env";
import { demo } from "@/server/features/demo";
import { health } from "@/server/features/health";
import { otel } from "@/server/features/otel";
import { userContextMiddleware } from "@/server/middleware/auth";

// First, init Sentry to capture errors
Sentry.init({
  dsn: env.SENTRY_DSN,
  sendDefaultPii: true,
});

// API routes that will be traced and exposed via RPC
const api = new Hono().route("/health", health).route("/", demo);

const app = new Hono()
  // OTel proxy must be BEFORE tracing middleware (avoids recursive tracing)
  .route("/api/otel", otel)
  // OpenTelemetry Middleware - traces all requests after this point
  .use(httpInstrumentationMiddleware())
  // User context middleware - injects user info into traces and logs
  .use("*", userContextMiddleware)
  // Traced API routes - mounted AFTER middleware
  .route("/api", api);

// Static file serving and SPA fallback
const isProd = env.ENV === "production";

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
