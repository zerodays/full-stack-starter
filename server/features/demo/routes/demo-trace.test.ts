import { expect, test } from "vitest";
import { createRouter } from "@/server/lib/router";
import { authMiddleware } from "@/server/middleware/auth.middleware";
import { getTestApp } from "@/server/utils/testing/test-app";
import { TestUser1, testUsers } from "@/server/utils/testing/test-users";
import { demoTraceRoute } from "./demo-trace";

const testApp = createRouter();
testApp.use(authMiddleware);
testApp.route("/demo-trace", demoTraceRoute);

test("returns default greeting without name param", async () => {
  const { app, dbClient } = await getTestApp(testApp, { testUsers });

  const res = await app.request("/demo-trace?skipDb=true&delay=0", {
    headers: { "X-Test-User-Id": TestUser1.id },
  });

  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ message: "Hello!" });
  dbClient.close();
});

test("returns personalized greeting with name param", async () => {
  const { app, dbClient } = await getTestApp(testApp, { testUsers });

  const res = await app.request("/demo-trace?name=Tim&skipDb=true&delay=0", {
    headers: { "X-Test-User-Id": TestUser1.id },
  });

  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ message: "Hello, Tim!" });
  dbClient.close();
});

test("returns 401 without authentication", async () => {
  const { app, dbClient } = await getTestApp(testApp, { testUsers });

  const res = await app.request("/demo-trace?skipDb=true&delay=0");

  expect(res.status).toBe(401);
  dbClient.close();
});

test("returns 400 when delay exceeds maximum", async () => {
  const { app, dbClient } = await getTestApp(testApp, { testUsers });

  const res = await app.request("/demo-trace?delay=9999&skipDb=true", {
    headers: { "X-Test-User-Id": TestUser1.id },
  });

  expect(res.status).toBe(400);
  dbClient.close();
});
