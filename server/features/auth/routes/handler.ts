import { trace } from "@opentelemetry/api";
import { auth } from "@/server/lib/auth";
import { createRouter } from "@/server/lib/router";

export const authHandler = createRouter().all("/*", (c) => {
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
