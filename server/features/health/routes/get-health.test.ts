import { expect, test } from "vitest";
import { getTestApp } from "@/server/utils/testing/test-app";
import { getHealthRoute } from "./get-health";

test("health endpoint returns 200 with status ok", async () => {
  const { app, dbClient } = await getTestApp(getHealthRoute);

  const res = await app.request("/", {
    method: "GET",
  });

  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ status: "ok" });
  dbClient.close();
});
