import { createRouter } from "@/server/lib/router";

export const getHealthRoute = createRouter().get("/", (c) => {
  return c.json({ status: "ok" });
});
