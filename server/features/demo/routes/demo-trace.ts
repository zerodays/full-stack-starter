import { zValidator } from "@hono/zod-validator";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "@/server/db";
import { logger } from "@/server/logger";
import { withSpan } from "@/server/tracing";

const querySchema = z.object({
  delay: z.coerce.number().min(0).max(5000).optional().default(500),
  skipDb: z.coerce.boolean().optional().default(false),
});

export const demoTraceRoute = new Hono().get(
  "/",
  zValidator("query", querySchema),
  async (c) => {
    const { delay, skipDb } = c.req.valid("query");

    logger.info({ delay, skipDb }, "Demo trace started");

    if (!skipDb) {
      // This DB query is auto-traced by @opentelemetry/instrumentation-pg
      await db.execute(
        sql`SELECT 1 as "connection_test", NOW() as "current_time"`,
      );
      logger.info({ query: "connection_test" }, "Database query completed");
    }

    // Only use withSpan when you need custom business logic grouping
    await withSpan(
      "demo.external_api_call",
      { "demo.type": "simulation", "api.endpoint": "https://example.com" },
      async (span) => {
        span.addEvent("api.request_started", {
          "http.method": "GET",
          "http.url": "https://example.com/api",
        });

        // Simulate external API latency
        await new Promise((resolve) => setTimeout(resolve, delay));

        span.addEvent("api.response_received", {
          "http.status_code": 200,
          "response.size_bytes": 1024,
        });

        logger.info({ latency: delay }, "External API call completed");
      },
    );

    await fetch("https://jsonplaceholder.typicode.com/todos/1");

    logger.info("Demo trace completed");

    return c.json({
      message: "Trace complete! Check Axiom for the demo trace.",
      timestamp: new Date().toISOString(),
      params: { delay, skipDb },
    });
  },
);
