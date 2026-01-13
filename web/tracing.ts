import { type Span, SpanStatusCode, trace } from "@opentelemetry/api";

const tracer = trace.getTracer("web");

type SpanFn<T> = (span: Span) => Promise<T> | T;

/**
 * Simple tracing helper for frontend. Use for user interactions you want to track.
 *
 * Most tracing is automatic (page loads, fetch calls). Only use this for:
 * - User interactions (button clicks, form submits)
 * - Grouping multiple fetches under one user intent
 * - Adding business context (feature flags, user tier, etc.)
 *
 * @example
 * // Simple usage
 * await withSpan("checkout.submit", async (span) => {
 *   span.setAttribute("cart.items", items.length);
 *   await submitOrder();
 * });
 *
 * @example
 * // With attributes upfront
 * await withSpan(
 *   "settings.save",
 *   { "settings.theme": theme, "settings.notifications": notificationsEnabled },
 *   async () => {
 *     await saveSettings({ theme, notificationsEnabled });
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
 * Useful for adding context discovered during an operation.
 *
 * @example
 * // After loading user data
 * addSpanAttributes({ "user.plan": user.plan, "user.org": user.orgId });
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
 *   await loadOptionalData();
 * } catch (e) {
 *   recordSpanError(e);
 *   // Continue with fallback
 * }
 */
export function recordSpanError(error: Error): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.recordException(error);
  }
}
