import { Hono } from "hono";
import { postTracesRoute } from "./routes/post-traces";

// Plain Hono (not createRouter): this proxy needs no AppEnv providers, and it's
// mounted outside them — typing it AppEnv would falsely promise db/user.
export const otel = new Hono().route("/v1/traces", postTracesRoute);
