import { Hono } from "hono";
import type { AuthMiddlewareVariables } from "@/server/middleware/auth.middleware";
import type { DbMiddlewareVariables } from "@/server/middleware/db.middleware";

export type AppEnv = {
  Variables: AuthMiddlewareVariables & DbMiddlewareVariables;
};

export const createRouter = () => new Hono<AppEnv>();
