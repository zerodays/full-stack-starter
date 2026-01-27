import { createRouter } from "@/server/lib/router";
import { demoTraceRoute } from "./routes/demo-trace";

export const demo = createRouter().route("/demo-trace", demoTraceRoute);
