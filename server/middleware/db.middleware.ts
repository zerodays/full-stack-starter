import type { MiddlewareHandler } from "hono/types";
import { type Database, db } from "@/server/database";

export type DbMiddlewareVariables = {
  db: Database;
};

/**
 * Database middleware: injects the database instance into the context.
 */
export const dbMiddleware: MiddlewareHandler = async (c, next) => {
  c.set("db", db);
  await next();
};
