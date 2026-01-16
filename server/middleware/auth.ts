import { trace } from "@opentelemetry/api";
import type { MiddlewareHandler } from "hono";
import { auth } from "@/server/auth";
import { requestContext } from "@/server/request-context";

/**
 * User context middleware - injects user info into traces and logs.
 * Must be used after the OpenTelemetry middleware.
 */
export const userContextMiddleware: MiddlewareHandler = async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (session?.user) {
    const span = trace.getActiveSpan();
    span?.setAttribute("user.id", session.user.id);
    span?.setAttribute("user.email", session.user.email);

    await requestContext.run(
      { userId: session.user.id, userEmail: session.user.email },
      async () => {
        await next();
      },
    );
  } else {
    await next();
  }
};
