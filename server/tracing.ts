import {
  addSpanAttributes,
  createWithSpan,
  recordSpanError,
} from "@/lib/tracing";

/**
 * Server-side tracing helper. Use for custom spans around business logic.
 *
 * Most tracing is automatic (HTTP requests, DB queries). Only use this for:
 * - Grouping related operations under a business concept
 * - External API calls
 * - Complex multi-step operations you want visibility into
 *
 * @example
 * const result = await withSpan("order.process", async (span) => {
 *   span.setAttribute("order.id", orderId);
 *   return await processOrder(orderId);
 * });
 *
 * @example
 * const user = await withSpan("user.sync_profile",
 *   { "user.id": userId, "provider": "google" },
 *   async () => {
 *     await syncFromGoogle(userId);
 *     return await db.query.users.findFirst({ where: eq(users.id, userId) });
 *   }
 * );
 */
export const withSpan = createWithSpan("server");

export { addSpanAttributes, recordSpanError };
