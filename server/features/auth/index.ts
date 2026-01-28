import { createRouter } from "@/server/lib/router";
import { authHandler } from "./routes/handler";

export const authFeature = createRouter().route("/", authHandler);
