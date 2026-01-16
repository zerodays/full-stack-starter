import { Hono } from "hono";

export const helloRoute = new Hono().get("/", (c) => {
  return c.json({ message: "Hello from the Hono Server!" });
});
