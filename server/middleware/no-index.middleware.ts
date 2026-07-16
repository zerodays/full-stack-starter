import type { MiddlewareHandler } from "hono/types";
import env from "@/env.server";

export const shouldAllowSearchIndexing = env.ENV === "production";

/**
 * Add a 'X-Robots-Tag: noindex' header to the response if the environment is
 * non-production.
 */
export const noIndexMiddleware: MiddlewareHandler = async (c, next) => {
  if (!shouldAllowSearchIndexing) {
    c.header("X-Robots-Tag", "noindex");
  }
  await next();
};
