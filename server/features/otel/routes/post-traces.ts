import type { ContentfulStatusCode } from "hono/utils/http-status";
import env from "@/env";
import { logger } from "@/server/lib/logger";
import { createRouter } from "@/server/lib/router";

/**
 * OpenTelemetry trace proxy for frontend.
 * Forwards browser traces to Axiom, adding auth headers server-side.
 */
export const postTracesRoute = createRouter().post("/", async (c) => {
  if (!env.AXIOM_TOKEN || !env.AXIOM_DATASET) {
    logger.error("Axiom not configured for trace proxy");
    return c.json({ error: "Axiom not configured" }, 503);
  }

  try {
    const body = await c.req.arrayBuffer();
    const contentType =
      c.req.header("Content-Type") || "application/x-protobuf";

    const response = await fetch("https://api.axiom.co/v1/traces", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.AXIOM_TOKEN}`,
        "x-axiom-dataset": env.AXIOM_DATASET,
        "Content-Type": contentType,
      },
      body: body,
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error({ upstreamError: text }, "Axiom error:");
      return c.json(
        { error: "Upstream error", details: text },
        response.status as ContentfulStatusCode,
      );
    }

    return c.json({ success: true });
  } catch (e) {
    logger.error({ error: e }, "Proxy error:");
    return c.json({ error: "Proxy error" }, 500);
  }
});
