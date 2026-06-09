import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { project } from "@/server/database/schema";
import { apiError } from "@/server/lib/http";
import { createRouter } from "@/server/lib/router";
import { requireAuth } from "@/server/middleware/auth.middleware";
import { projectIdParamSchema } from "../validators";

export const deleteProjectRoute = createRouter().delete(
  "/:id",
  requireAuth,
  zValidator("param", projectIdParamSchema),
  async (c) => {
    const db = c.get("db");
    const user = c.get("user");

    const { id } = c.req.valid("param");

    const [deleted] = await db
      .delete(project)
      .where(and(eq(project.ownerId, user.id), eq(project.id, id)))
      .returning();

    if (!deleted) {
      return apiError(c, 404, "Not found");
    }

    return c.json(deleted);
  },
);
