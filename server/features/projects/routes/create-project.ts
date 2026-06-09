import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import z from "zod";
import { project } from "@/server/database/schema";
import { apiError } from "@/server/lib/http";
import { createRouter } from "@/server/lib/router";
import { requireAuth } from "@/server/middleware/auth.middleware";

const PROJECT_COUNT_MAX = 3;

const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(255),
});

export const createProjectRoute = createRouter().post(
  "/",
  requireAuth,
  zValidator("json", createProjectSchema),
  async (c) => {
    const db = c.get("db");
    const user = c.get("user");

    const { name } = c.req.valid("json");

    const projectCount = await db.$count(project, eq(project.ownerId, user.id));

    if (projectCount >= PROJECT_COUNT_MAX) {
      return apiError(
        c,
        409,
        `Project limit reached. You can only create up to ${PROJECT_COUNT_MAX} projects.`,
      );
    }

    const [created] = await db
      .insert(project)
      .values({ name, ownerId: user.id })
      .returning();
    return c.json(created, 201);
  },
);
