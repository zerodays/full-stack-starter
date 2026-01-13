import { trace } from "@opentelemetry/api";
import pino from "pino";

/**
 * Trace-aware Pino logger.
 *
 * Automatically injects traceId and spanId into every log entry
 * when called within an active span. This allows correlating logs
 * with traces in your observability platform.
 *
 * Usage:
 *   import { logger } from "@/server/logger";
 *   logger.info({ userId: 123 }, "User logged in");
 *
 * Output includes traceId/spanId when inside a traced request:
 *   {"level":30,"traceId":"abc123...","spanId":"def456...","userId":123,"msg":"User logged in"}
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  mixin() {
    const span = trace.getActiveSpan();
    if (span) {
      const ctx = span.spanContext();
      return {
        traceId: ctx.traceId,
        spanId: ctx.spanId,
      };
    }
    return {};
  },
});
