import { Hono } from "hono";
import { demoTraceRoute } from "./routes/demo-trace";
import { helloRoute } from "./routes/hello";

export const demo = new Hono()
  // Add feature-specific middleware here if needed
  .route("/hello", helloRoute)
  .route("/demo-trace", demoTraceRoute);
