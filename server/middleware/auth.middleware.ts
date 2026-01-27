import { trace } from "@opentelemetry/api";
import type { MiddlewareHandler } from "hono";
import { auth } from "@/server/lib/auth";
import { requestContext } from "@/server/lib/request-context";

export type AuthMiddlewareVariables = {
  user: typeof auth.$Infer.Session.user;
};

/**
 * User context middleware - injects user info into traces and logs.
 * Returns 401 if there is no user defined.
 * Must be used after the OpenTelemetry middleware.
 */
export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

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
};
