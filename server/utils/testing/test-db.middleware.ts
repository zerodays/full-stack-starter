import type { drizzle } from "drizzle-orm/pglite";
import type { MiddlewareHandler } from "hono/types";

export function createTestDbMiddleware(
  db: ReturnType<typeof drizzle>,
): MiddlewareHandler {
  return async (c, next) => {
    c.set("db", db);
    await next();
  };
}
