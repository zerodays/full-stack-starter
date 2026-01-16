import { Hono } from "hono";
import { postTracesRoute } from "./routes/post-traces";

export const otel = new Hono()
  // Add feature-specific middleware here if needed
  .route("/v1/traces", postTracesRoute);
