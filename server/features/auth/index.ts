import { Hono } from "hono";
import { authHandler } from "./routes/handler";

export const authFeature = new Hono().route("/", authHandler);
