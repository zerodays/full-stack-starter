import { trace } from "@opentelemetry/api";
import { Hono } from "hono";
import { auth } from "@/server/auth";

export const authHandler = new Hono().all("/*", (c) => {
  // Add auth action to current span for better observability
  // e.g. /api/auth/sign-in/email -> "sign-in/email"
  const span = trace.getActiveSpan();
  if (span) {
    const path = new URL(c.req.url).pathname;
    const action = path.replace(/^\/api\/auth\/?/, "") || "unknown";
    span.setAttribute("auth.action", action);
  }

  return auth.handler(c.req.raw);
});
