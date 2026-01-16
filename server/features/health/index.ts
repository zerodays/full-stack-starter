import { Hono } from "hono";
import { getHealthRoute } from "./routes/get-health";

export const health = new Hono()
  // Add feature-specific middleware here if needed
  .route("/", getHealthRoute);
