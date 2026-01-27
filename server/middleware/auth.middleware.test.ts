import { expect, test } from "vitest";
import { createRouter } from "@/server/lib/router";
import { authMiddleware } from "@/server/middleware/auth.middleware";
import { getTestApp } from "@/server/utils/testing/test-app";
import { TestUser1, testUsers } from "@/server/utils/testing/test-users";

// Create a dummy app with requireAuth middleware
const testApp = createRouter();
testApp.use(authMiddleware);
testApp.get("/", (c) => {
  return c.json({ message: "Hello, world!" });
});

test("unauthenticated requests return 401", async () => {
  const { app, dbClient } = await getTestApp(testApp, {
    testUsers,
  });

  const res = await app.request("/", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  expect(res.status).toBe(401);
  dbClient.close();
});

test("non-existing user returns 401", async () => {
  const { app, dbClient } = await getTestApp(testApp);

  const res = await app.request("/", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Test-User-Id": "11111111-1111-1111-1111-111111111111",
    },
  });

  expect(res.status).toBe(401);
  dbClient.close();
});

test("authenticated requests return 200", async () => {
  const { app, dbClient } = await getTestApp(testApp, {
    testUsers,
  });

  const res = await app.request("/", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Test-User-Id": TestUser1.id,
    },
  });

  expect(res.status).toBe(200);
  dbClient.close();
});
