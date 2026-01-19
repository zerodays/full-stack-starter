import { Hono } from "hono";
import { demoTraceRoute } from "./routes/demo-trace";

export const demo = new Hono().route("/demo-trace", demoTraceRoute);
