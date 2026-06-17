import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * The one sanctioned way to return an error response. Codifies the error shape
 * (`{ error: string }`) so it can't drift across handlers, and stays generic
 * over the status code so the returned error survives into the RPC client type
 * (a non-generic helper would collapse the route's response type to `unknown`).
 *
 * Use this on the *return* path — expected errors, including guards. The
 * unexpected path throws instead and is handled centrally by `onError`.
 *
 * Routes under the ambient API middleware get `c.apiError(status, message)` as
 * sugar over this (see `api-error.middleware.ts`); call this form directly only
 * outside that stack (e.g. the otel proxy, `app.notFound`/`app.onError`).
 */
export const apiError = <S extends ContentfulStatusCode>(
  c: Context,
  status: S,
  message: string,
) => c.json({ error: message }, status);
