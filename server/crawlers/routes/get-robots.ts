import env from "@/env.server";
import { createRouter } from "@/server/lib/router";

/**
 * robots.txt for crawlers.
 *
 * Non-production environments disallow all crawling, production allows
 * everything except the API.
 */
export const getRobotsRoute = createRouter().get("/robots.txt", (c) => {
  const body =
    env.ENV === "production"
      ? "User-agent: *\nDisallow: /api/\n"
      : "User-agent: *\nDisallow: /\n";

  c.header("Content-Type", "text/plain; charset=utf-8");
  return c.body(body);
});
