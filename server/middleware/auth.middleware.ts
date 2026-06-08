import { trace } from "@opentelemetry/api";
import * as Sentry from "@sentry/bun";
import type { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { auth } from "@/server/lib/auth";
import { apiError } from "@/server/lib/http";
import { requestContext } from "@/server/lib/request-context";

export type AuthMiddlewareVariables = {
  user?: typeof auth.$Infer.Session.user;
};

/**
 * Provider: resolves the user from the session and populates context.
 * Does not block requests without a session — applied ambiently across the API.
 * Must be used after the OpenTelemetry middleware.
 */
export const sessionMiddleware: MiddlewareHandler = async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (session?.user) {
    c.set("user", session.user);

    const span = trace.getActiveSpan();
    span?.setAttribute("user.id", session.user.id);
    span?.setAttribute("user.email", session.user.email);

    Sentry.setUser({ id: session.user.id, email: session.user.email });

    await requestContext.run(
      { userId: session.user.id, userEmail: session.user.email },
      async () => {
        await next();
      },
    );
    return;
  }

  await next();
};

/**
 * Guard: requires an authenticated user on context. Returns 401 if not set.
 * Apply per-route (not globally) on the routes that need protection. Relies on
 * the ambient sessionMiddleware (or test auth middleware) having run first.
 */
export const requireAuth = createMiddleware<{
  Variables: { user: typeof auth.$Infer.Session.user };
}>(async (c, next) => {
  if (!c.get("user")) {
    return apiError(c, 401, "Unauthorized");
  }

  await next();
});
