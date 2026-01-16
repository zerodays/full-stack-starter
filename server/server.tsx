// IMPORTANT: Instrumentation must be first to patch modules before they're loaded
import "@/server/instrumentation";

import { httpInstrumentationMiddleware } from "@hono/otel";
import * as Sentry from "@sentry/bun";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import env from "@/env.ts";
import { db } from "@/server/db";

const { logger } = await import("@/server/logger");
const { withSpan } = await import("@/server/tracing");
const { requestContext } = await import("@/server/request-context");
const { trace } = await import("@opentelemetry/api");

// TODO: Uncomment when Better Auth is set up
// import { auth } from "@/server/auth";

// First, init Sentry to capture errors
Sentry.init({
  dsn: env.SENTRY_DSN,
  sendDefaultPii: true,
});
const app = new Hono();

app.post("/api/otel/v1/traces", async (c) => {
  if (!env.AXIOM_TOKEN || !env.AXIOM_DATASET) {
    // Silent fail or log? For now let's return 503 Service Unavailable
    logger.error("Axiom not configured for trace proxy");
    return c.json({ error: "Axiom not configured" }, 503);
  }

  try {
    const body = await c.req.arrayBuffer();
    const contentType =
      c.req.header("Content-Type") || "application/x-protobuf";

    const response = await fetch("https://api.axiom.co/v1/traces", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.AXIOM_TOKEN}`,
        "x-axiom-dataset": env.AXIOM_DATASET,
        "Content-Type": contentType,
      },
      body: body,
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error({ upstreamError: text }, "Axiom error:");
      return c.json(
        { error: "Upstream error", details: text },
        response.status as ContentfulStatusCode,
      );
    }

    return c.json({ success: true });
  } catch (e) {
    logger.error({ error: e }, "Proxy error:");
    return c.json({ error: "Proxy error" }, 500);
  }
});

// OpenTelemetry Middleware - auto-traces all requests and injects user context
app.use(httpInstrumentationMiddleware());

// User context middleware - injects user info into traces and logs
// TODO: Uncomment auth logic when Better Auth is set up
app.use("*", async (c, next) => {
  // const session = await auth.api.getSession({ headers: c.req.raw.headers });
  const session = null as { user: { id: string; email: string } } | null; // Remove this line when auth is ready

  if (session?.user) {
    // Add to span for tracing
    const span = trace.getActiveSpan();
    span?.setAttribute("user.id", session.user.id);
    span?.setAttribute("user.email", session.user.email);

    // Run with user context for logging
    await requestContext.run(
      { userId: session.user.id, userEmail: session.user.email },
      async () => {
        await next();
      },
    );
  } else {
    await next();
  }
});

app.get("/api/hello", (c) => {
  return c.json({ message: "Hello from the Hono Server!" });
});

app.get("/api/demo-trace", async (c) => {
  // Logging: automatically includes traceId and spanId
  logger.info("Demo trace started");

  // This DB query is auto-traced by @opentelemetry/instrumentation-pg
  await db.execute(sql`SELECT 1 as "connection_test", NOW() as "current_time"`);
  logger.info({ query: "connection_test" }, "Database query completed");

  // Only use withSpan when you need custom business logic grouping
  await withSpan(
    "demo.external_api_call",
    { "demo.type": "simulation", "api.endpoint": "https://example.com" },
    async (span) => {
      // Events: timestamped markers within a span
      span.addEvent("api.request_started", {
        "http.method": "GET",
        "http.url": "https://example.com/api",
      });

      // Simulate external API latency
      await new Promise((resolve) => setTimeout(resolve, 500));

      span.addEvent("api.response_received", {
        "http.status_code": 200,
        "response.size_bytes": 1024,
      });

      logger.info({ latency: 500 }, "External API call completed");
    },
  );

  await fetch("https://jsonplaceholder.typicode.com/todos/1");

  logger.info("Demo trace completed");

  return c.json({
    message: "Trace complete! Check Axiom for the demo trace.",
    timestamp: new Date().toISOString(),
  });
});

const isProd = env.ENV === "production";

if (isProd) {
  // Serve pre-built static files from dist-static directory.
  // Rewrites paths to map clean URLs to their corresponding HTML files.
  app.use(
    "*",
    serveStatic({
      root: "./dist-static",
      rewriteRequestPath: (requestPath) => {
        if (requestPath === "/") return "/index.html";
        // Keep asset and JSON paths as-is
        if (requestPath.includes(".")) return requestPath;
        // Map clean URLs (e.g., /about) to their prerendered HTML
        return `${requestPath}.html`;
      },
    }),
  );
}

// SPA fallback: serve index.html for any unmatched routes.
// This allows client-side routing to handle the path instead of returning 404.
app.get("*", async (c) => {
  const html = await Bun.file(
    isProd ? "./dist-static/index.html" : "./index.html",
  ).text();
  return c.html(html);
});

export default app;
