import type { Hono } from "hono";
import { type AppEnv, createRouter } from "@/server/lib/router";
import testAuthMiddleware from "@/server/utils/testing/test-auth.middleware";
import { createTestDb } from "@/server/utils/testing/test-db";
import { createTestDbMiddleware } from "@/server/utils/testing/test-db.middleware";
import {
  type InsertUser,
  importTestUsers,
} from "@/server/utils/testing/test-user";

interface TestAppOptions {
  testUsers?: InsertUser[];
}

export async function getTestApp(
  app: Hono<AppEnv>,
  options: TestAppOptions = {},
) {
  // Create a fresh ephemeral database
  const { dbClient, db } = await createTestDb();

  // Import test users if needed
  if (options.testUsers) {
    await importTestUsers(db, options.testUsers);
  }

  // Create fresh app instance to inject the db middleware
  const testApp = createRouter();
  testApp.use(createTestDbMiddleware(db));
  testApp.use(testAuthMiddleware);
  testApp.route("/", app);

  return { app: testApp, db, dbClient };
}
