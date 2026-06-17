# Backend conventions

1. Middleware that "enriches" context is run globally, e.g. for our user info,
   and currently db (this is slightly controversial, the more general approach is
   to simply import the db in the handler, but for us it buys us testability via
   pglite and enables any potential RLS future). These providers run via
   `api.use(...)` in `server.ts`.
1. Access _decisions_ (auth, subscription, ...) are the opposite: never global,
   always per-route guards — see `requireAuth` (`middleware/auth.middleware.ts`)
   applied directly on the route in `demo/routes/demo-trace.ts`. A global guard
   would gate every route mounted after it; keeping it per-route is what avoids
   that leak.
1. We develop this backend "feature first", meaning we split by features and one
   feature owns its route prefix (e.g. a `chat` feature, owns the `/chat` prefix).
1. When accessing user owned resources, e.g. a chat, remember that we first need
   to check if the resource exists and if the user has access to it, which should
   both return a 404, to avoid leaking information (a 403 would reveal the
   resource exists). We could potentially log the cases tho, but not right now.
1. Observability is handled via OTEL and Axiom. The latter provides an MCP to build
   dashboards, which usually results in a better result than the default Axiom one.
1. Always have the unhappy path in mind.

## Error handling

We return **expected** errors from the handler via `apiError`, e.g.
`return apiError(c, 404, "Not found")` — and yes, even an anticipated 5xx counts
(a failing upstream is still an expected outcome). **Unexpected** errors we let
throw, to be handled by hono's own `onError` in [the server](./server.ts).

I know this smells a bit like Go, but there is a good reason: a returned error
from a handler shows up as part of the exported RPC type for the frontend
(only handler returns, though — guard/middleware returns don't), and I just like
errors as values.

So in practice, you should almost never do try/catch in handlers to return
500\. The only reason to use try/catch is if you get a downstream error (e.g.
from Postgres) and you want to properly log/type it.

## When features get large

For small features, the guiding principle is to just put everything inside
their handlers. One lean file that shouldn't be more than 200-300 lines long
that just holds all the logic.

Once a feature grows, split out only the parts that earn it:

- `routes/` — the thin handlers (guard → validate → call service → respond).
- `validators.ts` — zod schemas.
- `service.ts` — business logic; takes `db` as an argument.
- `queries.ts` — db access, pulled out of the service once queries pile up or
  get shared.
- `lib/` — feature-local helpers. If a helper is useful to *other* features, it
  graduates to `server/lib` instead.

The flow is handler → service → queries, with `db` passed down (never grabbed
from context inside a service). Add each file only when the feature grows or you
start sharing — a small feature stays one handler.

**Extract on a pressure, not for symmetry.** The default is a fat handler that
owns its whole route; that locality is the point (one file is the complete
truth — easiest to read, change, and reason about). Reach for a layer only when
a concrete pressure shows up:

- **Sharing** — a query is needed by a second route → pull it into `queries.ts`.
- **Size** — a handler grows past what reads in one screen → pull the logic into
  a `service` function.
- **Testability** — you want to exercise a rule without faking HTTP → a `service`
  function takes `db` + args (never `c`), so it's unit-testable.

The burden of proof is on the layer, not the handler. **Never add a pass-through
layer** — a `service` that only forwards to one query is a smell; inline it.
Reflexively giving every feature a `service.ts` + `queries.ts` is how you get
ravioli: a three-line route smeared across four files, with indirection you pay
on every read. When in doubt, leave it in the handler.

## API paths

Paths concatenate down the mount tree — each level adds one segment:

1. **`server.ts` owns the prefixes** — `/api` plus each feature's prefix
   (`/demo`). The one place to read the whole URL map.
1. **A feature's `index.ts` owns its in-feature paths** (`/`, `/:id`), relative
   to itself — it never repeats its own prefix.
1. **Route files are relative to the route** — usually just `/`.

```ts
api.route("/demo", demo);                       // server.ts     -> /api/demo
createRouter().route("/trace", demoTraceRoute); // demo/index.ts -> /demo/trace
createRouter().get("/", requireAuth, handler);  // demo-trace.ts -> /trace
```

So a feature is prefix-agnostic — moving it is a one-line change in `server.ts`.

## Database migrations

Schema lives in `database/schema`. The path from a schema edit to staging is
split on purpose:

1. **Local dev → `db:push`.** Edit the schema, run `bun run db:push`, Drizzle
   syncs your local DB to match. No migration files — push is for fast iteration
   while the shape is still moving.
1. **Branch ready → `db:generate`.** Once the schema has settled, run
   `bun run db:generate` to emit the SQL migration into `database/migrations`
   and commit it. That committed SQL is the reviewable, tracked artifact —
   generate *once*, at the end, not per tweak.
1. **Staging/prod → automatic.** Migrations apply on server boot via
   `runMigrations()` (see `server.ts`), so deploying the branch applies the
   committed migration. Nothing manual.

The rule of thumb: **never `generate` mid-dev.** Push while iterating, generate
once when the branch is ready, let the deploy apply it.
