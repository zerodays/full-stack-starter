import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { project } from "@/server/database/schema";
import { createRouter } from "@/server/lib/router";
import { requireAuth } from "@/server/middleware/auth.middleware";
import { projectIdParamSchema } from "../validators";

export const getProjectRoute = createRouter().get(
  "/:id",
  requireAuth,
  zValidator("param", projectIdParamSchema),
  async (c) => {
    const db = c.get("db");
    const user = c.get("user");

    const { id } = c.req.valid("param");

    const found = await db.query.project.findFirst({
      where: and(eq(project.ownerId, user.id), eq(project.id, id)),
    });

    if (!found) {
      return c.apiError(404, "Project not found");
    }

    return c.json(found);
  },
);
