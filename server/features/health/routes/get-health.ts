import { Hono } from "hono";

export const getHealthRoute = new Hono().get("/", (c) => {
  return c.json({ status: "ok" });
});
