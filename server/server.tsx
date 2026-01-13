import { db } from "@/server/db";
import "@/server/instrumentation";
import {
  context,
  propagation,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";
import * as Sentry from "@sentry/bun";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { routePath } from "hono/route";
import env from "@/env.ts";

// First, init Sentry to capture errors
Sentry.init({
  dsn: env.SENTRY_DSN,
  sendDefaultPii: true,
});
const app = new Hono();

// OpenTelemetry Middleware
app.use("*", async (c, next) => {
  // Skip trace proxy endpoint to avoid loops
  if (c.req.path.startsWith("/api/otel")) {
    return next();
  }

  const tracer = trace.getTracer(env.OTEL_SERVICE_NAME);
  const activeContext = propagation.extract(context.active(), c.req.header());

  return await context.with(activeContext, async () => {
    return await tracer.startActiveSpan(
      // `${c.req.method} ${c.req.path}`,
      `${c.req.method} ${routePath(c) || c.req.path}`,
      async (span) => {
        span.setAttribute("http.method", c.req.method);
        span.setAttribute("http.url", c.req.url);

        try {
          await next();

          span.setAttribute("http.status_code", c.res.status);
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
  const tracer = trace.getTracer(env.OTEL_SERVICE_NAME);

  return await tracer.startActiveSpan("demo-operation", async (span) => {
    try {
      span.setAttribute("demo.type", "manual_trace");
      span.setAttribute("user.id", "anonymous_demo_user");
      span.addEvent("starting_simulation");

      // 1. Real Database Query (Auto-instrumented)
      // We don't need to wrap this in a manual span or set attributes.
      // The @opentelemetry/instrumentation-pg package handles it automatically.
      await db.execute(
        sql`SELECT 1 as "connection_test", NOW() as "current_time"`,
      );

      span.addEvent("processing_data");

      // 2. Simulate External API Call or Heavy Processing
      await tracer.startActiveSpan("process.data", async (procSpan) => {
        procSpan.setAttribute("data.size_bytes", 1024);
        procSpan.setAttribute("process.strategy", "fast-path");

        // Simulate processing latency
        await new Promise((resolve) => setTimeout(resolve, 500));

        procSpan.end();
      });

      span.addEvent("finished_simulation");

      return c.json({
        message:
          "Full trace simulated! Check Axiom for the 'demo-operation' trace with nested spans.",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
});

if (process.env.NODE_ENV === "production") {
  app.use("/static/*", serveStatic({ root: "./dist" }));
}

// HTML entry point (different for dev and prod)
app.get("*", (c) => {
  const isProd = process.env.NODE_ENV === "production";
  return c.html(
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Bun + Hono + React</title>
        {isProd ? (
          <script type="module" src="/static/client.js"></script>
        ) : (
          <script type="module" src="/web/client.tsx"></script>
        )}
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>,
  );
});

export default app;
