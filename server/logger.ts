import { trace } from "@opentelemetry/api";
import pino from "pino";
import env from "@/env";
import { requestContext } from "./request-context";

/**
 * Trace and user-aware Pino logger.
 *
 * Automatically injects into every log entry:
 * - traceId/spanId when inside an active span
 * - userId/userEmail when inside an authenticated request
 *
 * Usage:
 *   import { logger } from "@/server/logger";
 *   logger.info("User clicked checkout");
 *
 * Output (authenticated request with active span):
 *   {"level":30,"traceId":"abc...","spanId":"def...","userId":"123","userEmail":"user@example.com","msg":"User clicked checkout"}
 */
export const logger = pino({
  level: env.LOG_LEVEL || "info",
  mixin() {
    const result: Record<string, string> = {};

    // Add trace context
    const span = trace.getActiveSpan();
    if (span) {
      const spanCtx = span.spanContext();
      result.traceId = spanCtx.traceId;
      result.spanId = spanCtx.spanId;
    }

    // Add user context
    const reqCtx = requestContext.getStore();
    if (reqCtx?.userId) {
      result.userId = reqCtx.userId;
    }
    if (reqCtx?.userEmail) {
      result.userEmail = reqCtx.userEmail;
    }

    return result;
  },
});
