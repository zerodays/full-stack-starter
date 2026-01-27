import { createRouter } from "@/server/lib/router";
import { postTracesRoute } from "./routes/post-traces";

export const otel = createRouter()
  // Add feature-specific middleware here if needed
  .route("/v1/traces", postTracesRoute);
