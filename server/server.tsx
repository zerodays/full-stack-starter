import * as Sentry from "@sentry/bun";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import env from "@/env.ts";

// First, init Sentry to capture errors
Sentry.init({
  dsn: env.SENTRY_DSN,
  sendDefaultPii: true,
});
const app = new Hono();

app.get("/api/hello", (c) => {
  return c.json({ message: "Hello from the Hono Server!" });
});

const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  // Serve pre-built static files from dist-static directory.
  // Rewrites paths to map clean URLs to their corresponding HTML files.
  app.use(
    "*",
    serveStatic({
      root: "./dist-static",
      rewriteRequestPath: (requestPath) => {
        if (requestPath === "/") return "/index.html";
        // Keep asset and JSON paths as-is
        if (requestPath.includes(".")) return requestPath;
        // Map clean URLs (e.g., /about) to their prerendered HTML
        return `${requestPath}.html`;
      },
    }),
  );
}

// SPA fallback: serve index.html for any unmatched routes.
// This allows client-side routing to handle the path instead of returning 404.
app.get("*", async (c) => {
  const html = await Bun.file(
    isProd ? "./dist-static/index.html" : "./index.html",
  ).text();
  return c.html(html);
});

export default app;
