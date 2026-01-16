import { Hono } from "hono";
import { auth } from "@/server/auth";

export const authHandler = new Hono().all("/*", (c) => {
  return auth.handler(c.req.raw);
});
