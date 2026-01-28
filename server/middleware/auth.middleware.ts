import { trace } from "@opentelemetry/api";
import type { MiddlewareHandler } from "hono";
import { auth } from "@/server/lib/auth";
import { requestContext } from "@/server/lib/request-context";

export type AuthMiddlewareVariables = {
  user: typeof auth.$Infer.Session.user;
};

/**
 * Session middleware - resolves the user from the session and populates context.
 * Does not block requests without a session.
 * Must be used after the OpenTelemetry middleware.
 */
export const sessionMiddleware: MiddlewareHandler = async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (session?.user) {
    c.set("user", session.user);

    const span = trace.getActiveSpan();
    span?.setAttribute("user.id", session.user.id);
    span?.setAttribute("user.email", session.user.email);

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
 * Requires an authenticated user on context. Returns 401 if not set.
 * Must be used after sessionMiddleware (or test auth middleware).
 */
export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
};
