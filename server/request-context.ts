import { AsyncLocalStorage } from "node:async_hooks";

interface RequestContext {
  userId?: string;
  userEmail?: string;
}

/**
 * Request-scoped context using AsyncLocalStorage.
 *
 * This allows sharing request data (like user info) across the request lifecycle
 * without passing it explicitly. Used by:
 * - Logger: automatically includes userId/userEmail in log entries
 * - Tracing: span attributes are set separately but from the same source
 *
 * @example
 * // In middleware (set context)
 * await requestContext.run({ userId: "123", userEmail: "user@example.com" }, async () => {
 *   await next();
 * });
 *
 * // Anywhere in request (read context)
 * const ctx = requestContext.getStore();
 * console.log(ctx?.userId);
 */
export const requestContext = new AsyncLocalStorage<RequestContext>();
