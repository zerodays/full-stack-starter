import { hc } from "hono/client";
import type { AppType } from "@/server/server";

/**
 * Type-safe API client using Hono RPC.
 *
 * Usage:
 * ```ts
 * // GET /api/health
 * const health = await api.health.$get();
 * const data = await health.json();
 *
 * // GET /api/hello
 * const hello = await api.hello.$get();
 *
 * // POST /api/otel/v1/traces
 * await api.otel["v1"].traces.$post({ ... });
 * ```
 */
export const api = hc<AppType>("/api");
