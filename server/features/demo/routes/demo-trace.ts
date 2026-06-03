import { zValidator } from "@hono/zod-validator";
import { createRouter } from "@/server/lib/router";
import { requireAuth } from "@/server/middleware/auth.middleware";
import { demoTraceQuerySchema } from "../validators";
import { runDemoTrace } from "../service";

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
