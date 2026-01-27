import type { MiddlewareHandler } from "hono/types";
import { db } from "@/server/database";

export type DbMiddlewareVariables = {
  db: typeof db;
};

/**
 * Database middleware: injects the database instance into the context.
 */
export const dbMiddleware: MiddlewareHandler = async (c, next) => {
  c.set("db", db);
  await next();
};
