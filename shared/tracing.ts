import { type Span, SpanStatusCode, trace } from "@opentelemetry/api";

type SpanFn<T> = (span: Span) => Promise<T> | T;

type SpanAttributes = Record<string, string | number | boolean>;

/**
 * Creates a withSpan function bound to a specific tracer.
 *
 * @example
 * const withSpan = createWithSpan("server");
 * await withSpan("order.process", async (span) => {
 *   span.setAttribute("order.id", orderId);
 *   return await processOrder(orderId);
 * });
 */
export function createWithSpan(tracerName: string) {
  const tracer = trace.getTracer(tracerName);

  // Overload: withSpan(name, fn)
  async function withSpan<T>(name: string, fn: SpanFn<T>): Promise<T>;
  // Overload: withSpan(name, attrs, fn)
  async function withSpan<T>(
    name: string,
    attrs: SpanAttributes,
    fn: SpanFn<T>,
  ): Promise<T>;
  // Implementation
  async function withSpan<T>(
    name: string,
    fnOrAttrs: SpanFn<T> | SpanAttributes,
    maybeFn?: SpanFn<T>,
  ): Promise<T> {
    const hasAttrs = typeof fnOrAttrs !== "function";
    const attrs = hasAttrs ? fnOrAttrs : undefined;
    const fn = hasAttrs ? maybeFn : fnOrAttrs;

    if (!fn) {
      throw new Error("withSpan requires a function argument");
    }

    return tracer.startActiveSpan(name, async (span) => {
      try {
        if (attrs) {
          span.setAttributes(attrs);
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

  return withSpan;
}

/**
 * Add attributes to the current active span without creating a new one.
 * Useful for adding context discovered mid-operation.
 *
 * @example
 * addSpanAttributes({ "project.id": project.id, "project.plan": project.plan });
 */
export function addSpanAttributes(attrs: SpanAttributes): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes(attrs);
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
