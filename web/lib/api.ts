import { hc } from "hono/client";
import type { AppType } from "@/server/server";
import { hcQueryTyped } from "./typed-client";

// Precompile the RPC client type so tsc instantiates hc<AppType> once, instead
// of tsserver re-instantiating it on every use.
// comes from: https://hono.dev/docs/guides/rpc
// If perf is still an issue, consider splitting the client per feature
type Client = ReturnType<typeof hc<AppType>>;

const client: Client = hc<AppType>("/api");
export const api = hcQueryTyped(client);
