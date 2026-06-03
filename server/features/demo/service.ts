import { sql } from "drizzle-orm";
import type { Database } from "@/server/database";
import { logger } from "@/server/lib/logger";
import { withSpan } from "@/server/lib/tracing";
import type { DemoTraceInput } from "./validators";

/**
 * Business logic for the demo trace. Takes the db explicitly (not from context)
 * so it stays unit-testable without HTTP and swappable in tests.
 */
export async function runDemoTrace(
  database: Database,
  { name, delay, skipDb }: DemoTraceInput,
) {
  logger.info({ name, delay, skipDb }, "Demo trace started");

  if (!skipDb) {
    // This DB query is auto-traced by @opentelemetry/instrumentation-pg
    await database.execute(
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

  return { message: name ? `Hello, ${name}!` : "Hello!" };
}
