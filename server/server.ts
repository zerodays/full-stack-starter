// IMPORTANT: Instrumentation must be first to patch modules before they're loaded
import "@/server/lib/instrumentation";

import { httpInstrumentationMiddleware } from "@hono/otel";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import * as Sentry from "@sentry/bun";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { HTTPException } from "hono/http-exception";
import { routePath } from "hono/route";
import env from "@/env.server";
import { runMigrations } from "@/server/database";
import { authFeature } from "@/server/features/auth";
import { demo } from "@/server/features/demo";
import { health } from "@/server/features/health";
import { otel } from "@/server/features/otel";
import { projects } from "@/server/features/projects";
import { apiError } from "@/server/lib/http";
import { logger } from "@/server/lib/logger";
import { createRouter } from "@/server/lib/router";
import { apiErrorMiddleware } from "@/server/middleware/api-error.middleware";
import { sessionMiddleware } from "@/server/middleware/auth.middleware";
import { dbMiddleware } from "@/server/middleware/db.middleware";
import { crawlers } from "./crawlers";
import {
  noIndexMiddleware,
  shouldAllowSearchIndexing,
} from "./middleware/no-index.middleware";

// First, init Sentry to capture errors
Sentry.init({
  dsn: env.SENTRY_DSN,
  sendDefaultPii: true,
});

if (env.VITEST == null) {
  // NOTE: if we ever scale the backend beyond one instance, this becomes a
  // race condition.
  await runMigrations();
}

// API routes — traced and exposed via RPC.
//
// Middleware layering (see server/README.md):
//   - Ambient providers run on every API route and make no access decision:
//     they only populate context (optional user, db).
//   - Access decisions are per-route guards (e.g. `requireAuth` on a route),
//     never applied globally — so they can't leak onto sibling routes.
const api = createRouter()
  // Ambient providers
  .use(apiErrorMiddleware, sessionMiddleware, dbMiddleware)
  // Features — each owns a prefix; protection is declared per-route inside it
  .route("/auth", authFeature)
  .route("/health", health)
  .route("/demo", demo)
  .route("/projects", projects);

const app = new Hono()
  // OTel proxy must be BEFORE tracing middleware (avoids recursive tracing)
  .route("/api/otel", otel)
  // OpenTelemetry Middleware - traces all requests after this point
  .use(
    httpInstrumentationMiddleware({
      spanNameFactory: (c) => `${c.req.method} ${routePath(c) ?? c.req.path}`,
    }),
  );

// If running in "development" or "staging" environment, add a `X-Robots-Tag:
// noindex` header so that the crawlers don't index our site. Conditionally add
// the middleware to the app so that it is not executed on *every* request in
// production.
if (!shouldAllowSearchIndexing) {
  app.use(noIndexMiddleware);
}

app
  // Top-level routes for crawlers: robots.txt (and possibly sitemap.xml)
  .route("/", crawlers)
  // Traced API routes - mounted AFTER middleware
  .route("/api", api);

app.notFound((c) => {
  logger.warn("Route not found");
  return apiError(c, 404, "Not found");
});

app.onError((err, c) => {
  const span = trace.getActiveSpan();

  if (err instanceof HTTPException) {
    const level = err.status >= 500 ? "error" : "warn";
    logger[level]({ status: err.status }, err.message);
    span?.setAttribute("error.reason", err.message);
    // Library-thrown 5xx is a real incident; 4xx is expected and would be noise.
    if (err.status >= 500) Sentry.captureException(err);
    return err.getResponse();
  }

  // Unexpected: log, record on the trace, report to Sentry, return a generic 500.
  // onError catches the throw and returns, so Sentry's default fetch-boundary
  // capture never fires — we must report it explicitly here.
  logger.error({ err }, "Unhandled error");
  span?.recordException(err);
  span?.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
  Sentry.captureException(err);
  // Return the trace id so a user-reported 500 can be matched to its trace.
  return c.json(
    { error: "Internal server error", traceId: span?.spanContext().traceId },
    500,
  );
});

// Static file serving and SPA fallback
const isProduction = env.ENV !== "development";

if (isProduction) {
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
    isProduction ? "./dist-static/index.html" : "./index.html",
  ).text();
  return c.html(html);
});

// Export type for Hono RPC client
export type AppType = typeof api;

export default app;
