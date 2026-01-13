import { type Span, SpanStatusCode, trace } from "@opentelemetry/api";

const tracer = trace.getTracer("server");

type SpanFn<T> = (span: Span) => Promise<T> | T;

/**
 * Simple tracing helper. Use this when you need a custom span for business logic.
 *
 * Most tracing is automatic (HTTP requests, DB queries). Only use this for:
 * - Grouping related operations under a business concept
 * - External API calls
 * - Complex multi-step operations you want visibility into
 *
 * @example
 * // Simple usage
 * const result = await withSpan("order.process", async (span) => {
 *   span.setAttribute("order.id", orderId);
 *   return await processOrder(orderId);
 * });
 *
 * @example
 * // With attributes upfront
 * const user = await withSpan("user.sync_profile",
 *   { "user.id": userId, "provider": "google" },
 *   async () => {
 *     await syncFromGoogle(userId);
 *     return await db.query.users.findFirst({ where: eq(users.id, userId) });
 *   }
 * );
 */
export async function withSpan<T>(
  name: string,
  fnOrAttrs: SpanFn<T> | Record<string, string | number | boolean>,
  maybeFn?: SpanFn<T>,
): Promise<T> {
  const hasAttrs = typeof fnOrAttrs !== "function";
  const attrs = hasAttrs ? fnOrAttrs : undefined;
  const fn = hasAttrs ? (maybeFn as SpanFn<T>) : fnOrAttrs;

  return tracer.startActiveSpan(name, async (span) => {
    try {
      if (attrs) {
        for (const [key, value] of Object.entries(attrs)) {
          span.setAttribute(key, value);
        }
      }

      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
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
  });
}

/**
 * Add attributes to the current active span without creating a new one.
 * Useful for adding context discovered mid-request.
 *
 * @example
 * // In a route handler, after looking up an entity
 * addSpanAttributes({ "project.id": project.id, "project.plan": project.plan });
 */
export function addSpanAttributes(
  attrs: Record<string, string | number | boolean>,
): void {
  const span = trace.getActiveSpan();
  if (span) {
    for (const [key, value] of Object.entries(attrs)) {
      span.setAttribute(key, value);
    }
  }
}

/**
 * Record an error on the current span without throwing.
 * Use when you handle an error gracefully but still want it visible in traces.
 *
 * @example
 * try {
 *   await riskyOperation();
 * } catch (e) {
 *   recordSpanError(e);
 *   return fallbackValue;
 * }
 */
export function recordSpanError(error: Error): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.recordException(error);
  }
}
