// IMPORTANT: Instrumentation must be first to patch modules before they're loaded
import "@/server/instrumentation";

import { db } from "@/server/db";
import {
  context,
  propagation,
  SpanKind,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";
import {
  ATTR_HTTP_REQUEST_METHOD,
  ATTR_HTTP_RESPONSE_STATUS_CODE,
  ATTR_URL_FULL,
} from "@opentelemetry/semantic-conventions";
import * as Sentry from "@sentry/bun";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { routePath } from "hono/route";
import env from "@/env.ts";

// TODO: Uncomment when Better Auth is set up
// import { auth } from "@/server/auth";

// First, init Sentry to capture errors
Sentry.init({
  dsn: env.SENTRY_DSN,
  sendDefaultPii: true,
});
const app = new Hono();

// OpenTelemetry Middleware - auto-traces all requests and injects user context
app.use("*", async (c, next) => {
  // Skip trace proxy endpoint to avoid loops
  if (c.req.path.startsWith("/api/otel")) {
    return next();
  }

  const tracer = trace.getTracer(env.OTEL_SERVICE_NAME);
  const activeContext = propagation.extract(context.active(), c.req.header());

  return await context.with(activeContext, async () => {
    // Start with the raw path, update to matched route after next()
    return await tracer.startActiveSpan(
      `${c.req.method} ${c.req.path}`,
      { kind: SpanKind.SERVER },
      async (span) => {
        span.setAttribute(ATTR_HTTP_REQUEST_METHOD, c.req.method);
        span.setAttribute(ATTR_URL_FULL, c.req.url);

        // Auto-inject user context from Better Auth session
        // TODO: Uncomment when Better Auth is set up
        // try {
        //   const session = await auth.api.getSession({ headers: c.req.raw.headers });
        //   if (session?.user) {
        //     span.setAttribute("user.id", session.user.id);
        //     span.setAttribute("user.email", session.user.email);
        //   }
        // } catch {
        //   // No session or auth error - continue without user context
        // }

        try {
          await next();

          // Update span name with matched route pattern (e.g., /api/users/:id)
          const matchedRoute = routePath(c);
          if (matchedRoute && matchedRoute !== "/*") {
            span.updateName(`${c.req.method} ${matchedRoute}`);
            span.setAttribute("http.route", matchedRoute);
          }

          span.setAttribute(ATTR_HTTP_RESPONSE_STATUS_CODE, c.res.status);
          if (c.res.status >= 400) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `HTTP ${c.res.status}`,
            });
          } else {
            span.setStatus({ code: SpanStatusCode.OK });
          }
        } catch (error) {
          span.recordException(error as Error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: (error as Error).message,
          });
          throw error;
        } finally {
          span.end();
        }
      },
    );
  });
});

app.post("/api/otel/v1/traces", async (c) => {
  if (!env.AXIOM_TOKEN || !env.AXIOM_DATASET) {
    // Silent fail or log? For now let's return 503 Service Unavailable
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
      console.error("Axiom error:", text);
      return c.json(
        { error: "Upstream error", details: text },
        // biome-ignore lint/suspicious/noExplicitAny: response.status is compatible
        response.status as any,
      );
    }

    return c.json({ success: true });
  } catch (e) {
    console.error("Proxy error:", e);
    return c.json({ error: "Proxy error" }, 500);
  }
});

app.get("/api/hello", (c) => {
  return c.json({ message: "Hello from the Hono Server!" });
});

app.get("/api/demo-trace", async (c) => {
  // This DB query is auto-traced by @opentelemetry/instrumentation-pg
  await db.execute(sql`SELECT 1 as "connection_test", NOW() as "current_time"`);

  // Only use withSpan when you need custom business logic grouping
  const { withSpan } = await import("@/server/tracing");

  await withSpan(
    "demo.external_api_call",
    { "demo.type": "simulation", "api.endpoint": "https://example.com" },
    async () => {
      // Simulate external API latency
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
  );

  return c.json({
    message: "Trace complete! Check Axiom for the demo trace.",
    timestamp: new Date().toISOString(),
  });
});

const isProd = process.env.NODE_ENV === "production";

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
