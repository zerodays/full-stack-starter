# AGENTS.md

Guidelines for AI coding agents working in this repository.

Backend conventions (middleware philosophy, error handling, feature layout,
migration workflow) live in @server/README.md — read it before writing backend
code (the @ auto-imports it for Claude Code; other agents: open the file).

## Tech Stack

- **Runtime:** Bun
- **Frontend:** React 19 + Vite + TailwindCSS v4
- **Data fetching:** TanStack Query over type-safe Hono RPC
- **Backend:** Hono (running on Bun)
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Better Auth
- **Validation:** Zod
- **Testing:** Vitest + PGlite (ephemeral test databases)
- **Secrets:** Infisical
- **Linting/Formatting:** Biome
- **i18n:** i18next

## Commands

```bash
# Development
bun dev                    # Start full dev environment (DB, Vite, Drizzle Studio)
bun run build              # Production build (SSG prerender + Vite build)
bun start                  # Run production server

# Testing
bun run test:dev           # Run vitest with env injected — use this locally
bun run test               # Run vitest bare (CI provides env)

# Code Quality
bun run lint               # Fix lint issues (Biome + locale check)
bun run lint:check         # Check only (CI)
bun run format             # Fix formatting
bun run format:check       # Check only (CI)
bun run typecheck          # Type-check all projects
bun run all                # format + lint + typecheck + build + test

# Database
bun run db:start           # Start PostgreSQL container
bun run db:push            # Sync schema to DB (dev iteration only)
bun run db:generate        # Generate migration SQL (once, when the branch is ready)
bun run db:migrate         # Apply migrations manually (deploys apply them on boot)
bun run auth:generate      # Regenerate Better Auth schema (after plugin changes)
```

### Secrets (Infisical)

Env-dependent scripts (`dev`, `db:*`, `test:dev`, `auth:generate`) are wrapped
in `infisical run --` — secrets come from Infisical, not a local `.env`.
Running the underlying tools bare (`vitest`, `drizzle-kit push`) fails `env.ts`
validation; always go through the package scripts.

## Project Structure

```
web/                    # Frontend (React)
  components/ui/        # Reusable UI components (shadcn pattern)
  lib/api.ts            # Hono RPC client wrapped for TanStack Query
  lib/typed-client.ts   # queryOptions/mutationOptions wrapper (typed ApiError)
  lib/auth-client.ts    # Better Auth client
  i18n/locales/         # Translation files

server/                 # Backend (Hono) — conventions in server/README.md
  server.ts             # Entry point & route assembly
  lib/                  # Shared server infra
    auth.ts             # Better Auth config
    logger.ts           # Pino logger with trace context
    http.ts             # apiError helper
    router.ts           # createRouter (Hono with typed context)
    tracing.ts          # withSpan + span helpers
  middleware/           # Ambient providers (session, db) + per-route guards (requireAuth)
  features/             # Feature modules (one folder per feature)
    {feature}/
      index.ts          # Assembles the feature's routes
      routes/           # One file per route handler (+ colocated *.test.ts)
  utils/testing/        # Test helpers (getTestApp, PGlite test DB, test users)
  database/
    schema/auth.ts      # Better Auth tables (auto-generated)
    schema/app.ts       # Custom tables (add your tables here)
    migrations/         # Generated SQL, applied on server boot

env.ts                  # Environment schema (@t3-oss/env-core + Zod)
scripts/                # Dev/CI scripts (check-locale, db-import)
```

## Code Style

### Formatting (Biome)
- 2-space indentation, double quotes, imports auto-organized

### TypeScript
- Strict mode enabled
- Use `type` imports: `import type { Foo } from "bar"`
- Path aliases: `@/*` (root), `~/*` (web/)

### Naming
- Files: `kebab-case.ts`
- Components: `PascalCase`
- Variables/functions: `camelCase`
- Database tables: `snake_case`

### React Components
- Use function declarations, not arrow functions for components
- Props type inline: `function Button({ ...props }: React.ComponentProps<"button">)`
- Use `cn()` from `~/lib/utils` for class merging

### Hono Routes
- One route handler per file in `server/features/{feature}/routes/`
- Build routes with `createRouter()` (typed context), never bare `new Hono()`
- Guards (`requireAuth`) are declared per-route, never globally; ambient
  middleware already provides `c.get("db")` and `c.get("user")`
```typescript
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createRouter } from "@/server/lib/router";
import { requireAuth } from "@/server/middleware/auth.middleware";

const schema = z.object({ name: z.string().trim().min(1) });

export const createItemRoute = createRouter().post(
  "/",
  requireAuth,
  zValidator("json", schema),
  async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    const { name } = c.req.valid("json");

    const [created] = await db
      .insert(item)
      .values({ name, ownerId: user.id })
      .returning();
    return c.json(created, 201);
  },
);
```

### Error Handling
- Validate input with Zod via `zValidator`
- **Expected** errors are returned: `return apiError(c, 409, "Limit reached")`
  (from `@/server/lib/http`) — these become typed error responses in the RPC
  client. **Unexpected** errors just throw; Hono's `onError` logs and maps them
  to 500. Details: `server/README.md` § Error handling
- Wrap frontend pages in `<ErrorBoundary>`

### Database (Drizzle)
- Define tables in `server/database/schema/app.ts`
- Use `drizzle-orm/pg-core` for table definitions
- Import tables from `@/server/database/schema` (the index re-exports all)
- Reference auth tables from `./auth.ts` for foreign keys

### Environment Variables
- Define in `env.ts` — add new variables to **both** the `server` schema and
  `runtimeEnvStrict`
- Access via `import env from "@/env"`
- Values are injected by Infisical; never hardcode secrets

### i18n
- Add translations to `web/i18n/locales/{lang}/common.ts`
- Use `useTranslation("common")` hook
- Run `bun run check-locale` to verify all keys exist in all locales

### Logging (Server)
```typescript
import { logger } from "@/server/lib/logger";
logger.info({ userId, action }, "User performed action");
```
Logger auto-injects traceId, spanId, userId when available.

### Tracing (OpenTelemetry)
- HTTP requests, DB queries, and fetch calls are auto-traced
- For custom spans: `import { withSpan } from "@/server/lib/tracing"`

## Testing

- Tests are colocated with routes: `routes/{route-name}.test.ts`
- `getTestApp` mounts your router on a fresh PGlite database (migrations
  applied) with test auth middleware — authenticate by sending an
  `X-Test-User-Id` header; omit it to exercise 401 paths
- Run with `bun run test:dev`

```typescript
import { expect, test } from "vitest";
import { createRouter } from "@/server/lib/router";
import { getTestApp } from "@/server/utils/testing/test-app";
import { TestUser1, testUsers } from "@/server/utils/testing/test-users";
import { createItemRoute } from "./create-item";

test("creates an item", async () => {
  const { app, dbClient } = await getTestApp(
    createRouter().route("/", createItemRoute),
    { testUsers },
  );

  const res = await app.request("/", {
    method: "POST",
    headers: { "X-Test-User-Id": TestUser1.id, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Hello" }),
  });

  expect(res.status).toBe(201);
  dbClient.close();
});
```

## Adding New Features

**Backend Route:** Create `server/features/{feature}/routes/{route-name}.ts`,
assemble in the feature's `index.ts`, mount the prefix in `server/server.ts`.
Path layering rules: `server/README.md` § API paths

**Frontend Page:** Add route to `web/router.tsx`, create component in `web/components/`

**Database Table:** Add to `server/database/schema/app.ts`. While iterating run
`bun run db:push`; when the branch is ready run `bun run db:generate` once and
commit the migration — deploys apply it on boot. Details: `server/README.md`
§ Database migrations

## Better Auth

- Config: `server/lib/auth.ts`
- Client: `web/lib/auth-client.ts`
- After adding plugins: `bun run auth:generate`
- Current user in routes: apply `requireAuth` and read `c.get("user")` — the
  ambient `sessionMiddleware` resolves the session once per request; never call
  `auth.api.getSession` inside a handler

## API Client (Frontend)

The Hono RPC client is wrapped (`web/lib/typed-client.ts`) so every endpoint
exposes `queryOptions` / `mutationOptions` with a typed `ApiError` channel:

```typescript
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "~/lib/api";

// Queries: request input goes in `input`, TanStack options alongside
const itemsQuery = useQuery(api.items.$get.queryOptions({ enabled: !!session }));

// Mutations: `mutate` takes the Hono request shape
const createItem = useMutation(api.items.$post.mutationOptions({}));
createItem.mutate({ json: { name: "Hello" } });

// Errors are typed: `status` is a literal union that narrows `body`
const message = createItem.error?.body.error;
```
