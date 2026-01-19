import { hc } from "hono/client";
import { hcQuery } from "hono-rpc-query";
import type { AppType } from "@/server/server";

const client = hc<AppType>("/api");
export const api = hcQuery(client);
