import { createRouter } from "@/server/lib/router";
import { getRobotsRoute } from "./routes/get-robots";

// Top-level routes for crawlers (robots.txt, sitemap.xml).
// Should be mounted at the site root, not just under /api.
export const crawlers = createRouter().route("/", getRobotsRoute);
