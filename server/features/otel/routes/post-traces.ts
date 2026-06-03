import { Hono } from "hono";
import env from "@/env";
import { apiError } from "@/server/lib/http";
import { logger } from "@/server/lib/logger";

/**
 * OpenTelemetry trace proxy for frontend.
 * Forwards browser traces to Axiom, adding auth headers server-side.
 *
 * Unauthenticated telemetry proxy — no AppEnv (db/user) needed.
 */
export const postTracesRoute = new Hono().post("/", async (c) => {
  if (!env.AXIOM_TOKEN || !env.AXIOM_DATASET) {
    logger.error("Axiom not configured for trace proxy");
    return apiError(c, 503, "Axiom not configured");
  }

  // Deliberately translate upstream/network failures into a logged response
  // rather than letting them bubble to onError — telemetry-ingestion blips
  // shouldn't page via Sentry.
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
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error(
        { status: response.status, upstreamError: text },
        "Axiom error",
      );
      return apiError(c, 502, "Upstream error");
    }

    return c.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Trace proxy error");
    return apiError(c, 502, "Trace proxy error");
  }
});
