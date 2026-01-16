import { trace } from "@opentelemetry/api";
import type { MiddlewareHandler } from "hono";
import { requestContext } from "@/server/request-context";

// TODO: Uncomment when Better Auth is set up
// import { auth } from "@/server/auth";

/**
 * User context middleware - injects user info into traces and logs.
 * Must be used after the OpenTelemetry middleware.
 */
export const userContextMiddleware: MiddlewareHandler = async (c, next) => {
  // TODO: Uncomment auth logic when Better Auth is set up
  // const session = await auth.api.getSession({ headers: c.req.raw.headers });
  const session = null as { user: { id: string; email: string } } | null; // Remove when auth is ready

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
