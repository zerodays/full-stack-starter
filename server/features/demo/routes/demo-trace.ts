import { zValidator } from "@hono/zod-validator";
import { createRouter } from "@/server/lib/router";
import { requireAuth } from "@/server/middleware/auth.middleware";
import { runDemoTrace } from "../service";
import { demoTraceQuerySchema } from "../validators";

// Thin route: guard → validate → call service → respond. No business logic here.
export const demoTraceRoute = createRouter().get(
  "/",
  requireAuth,
  zValidator("query", demoTraceQuerySchema),
  async (c) => {
    const result = await runDemoTrace(c.get("db"), c.req.valid("query"));
    return c.json(result);
  },
);
