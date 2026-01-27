import { createRouter } from "@/server/lib/router";
import { getHealthRoute } from "./routes/get-health";

export const health = createRouter()
  // Add feature-specific middleware here if needed
  .route("/", getHealthRoute);
