import { createWithSpan } from "@/shared/tracing";

/**
 * Frontend tracing helper. Use for user interactions you want to track.
 *
 * Most tracing is automatic (page loads, fetch calls). Only use this for:
 * - User interactions (button clicks, form submits)
 * - Grouping multiple fetches under one user intent
 * - Adding business context (feature flags, user tier, etc.)
 *
 * @example
 * await withSpan("checkout.submit", async (span) => {
 *   span.setAttribute("cart.items", items.length);
 *   await submitOrder();
 * });
 *
 * @example
 * await withSpan(
 *   "settings.save",
 *   { "settings.theme": theme, "settings.notifications": notificationsEnabled },
 *   async () => {
 *     await saveSettings({ theme, notificationsEnabled });
 *   }
 * );
 */
export const withSpan = createWithSpan("web");
