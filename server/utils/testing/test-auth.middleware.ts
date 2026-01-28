import type { PgliteDatabase } from "drizzle-orm/pglite/driver";
import type { MiddlewareHandler } from "hono";
import type * as schema from "@/server/database/schema";
import { logger } from "@/server/lib/logger";

const testAuthMiddleware: MiddlewareHandler = async (c, next) => {
  // Get bearer from header
  const testUserId = c.req.header("X-Test-User-Id");

  if (testUserId == null) {
    logger.info("The test request is not authenticated");
    await next();
    return;
  }

  const db: PgliteDatabase<typeof schema> = c.get("db");

  // Select the user from the database
  const user = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, testUserId),
  });

  if (user != null) {
    const mockedUser = {
      id: user.id,
      email: user.email,
    };

    logger.info(mockedUser, "Test user is authenticated");
    c.set("user", mockedUser);
  } else {
    logger.info("The test request is not authenticated");
  }

  await next();
};

export default testAuthMiddleware;
