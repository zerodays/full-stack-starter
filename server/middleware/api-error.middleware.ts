import { createMiddleware } from "hono/factory";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { apiError } from "@/server/lib/http";

declare module "hono" {
  interface Context {
    /**
     * Return an expected error response: `return c.apiError(404, "Not found")`.
     * Sugar over `apiError(c, …)` — same typed-return contract, so the status
     * and `{ error }` body still flow into the RPC client type. Available on
     * every route under the ambient API middleware stack.
     */
    apiError: <S extends ContentfulStatusCode>(
      status: S,
      message: string,
    ) => ReturnType<typeof apiError<S>>;
  }
}

/**
 * Provider: binds `c.apiError` so handlers can return errors without threading
 * `c` through the helper. Applied ambiently across the API.
 */
export const apiErrorMiddleware = createMiddleware(async (c, next) => {
  c.apiError = <S extends ContentfulStatusCode>(status: S, message: string) =>
    apiError(c, status, message);
  await next();
});
