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

if (process.env.NODE_ENV === "production") {
  app.use("/static/*", serveStatic({ root: "./dist" }));
}

// HTML entry point (different for dev and prod)
app.get("*", (c) => {
  const isProd = process.env.NODE_ENV === "production";
  return c.html(
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Bun + Hono + React</title>
        {isProd ? (
          <script type="module" src="/static/client.js"></script>
        ) : (
          <script type="module" src="/web/client.tsx"></script>
        )}
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>,
  );
});

export default app;
