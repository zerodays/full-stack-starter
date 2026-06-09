import { eq } from "drizzle-orm";
import { project } from "@/server/database/schema";
import { createRouter } from "@/server/lib/router";
import { requireAuth } from "@/server/middleware/auth.middleware";

export const listProjectsRoute = createRouter().get(
  "/",
  requireAuth,
  async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    const projects = await db.query.project.findMany({
      where: eq(project.ownerId, user.id),
    });

    return c.json(projects);
  },
);
