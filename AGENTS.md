# AGENTS.md

Guidelines for AI coding agents working in this repository.

## Tech Stack

- **Runtime:** Bun
- **Frontend:** React 19 + Vite + TailwindCSS v4
- **Backend:** Hono (running on Bun)
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Better Auth
- **Validation:** Zod
- **Linting/Formatting:** Biome
- **i18n:** i18next

## Commands

```bash
# Development
bun dev                    # Start full dev environment (DB, Vite, Drizzle Studio)
bun run build              # Production build
bun start                  # Run production server

# Code Quality
bun run lint               # Fix lint issues (Biome + locale check)
bun run lint:check         # Check only (CI)
bun run format             # Fix formatting
bun run format:check       # Check only (CI)
bun run typecheck          # Type-check all projects
bun run all                # Run format + lint + typecheck + build

# Database
bun run db:start           # Start PostgreSQL container
bun run db:push            # Sync schema to DB (dev only)
bun run db:generate        # Generate migrations
bun run db:migrate         # Apply migrations
bun run db:regenerate-auth # Regenerate Better Auth schema
```

## Project Structure

```
web/                    # Frontend (React)
  components/ui/        # Reusable UI components (shadcn pattern)
  lib/api.ts            # Type-safe Hono RPC client
  lib/auth-client.ts    # Better Auth client
  i18n/locales/         # Translation files

server/                 # Backend (Hono)
  server.tsx            # Entry point & route assembly
  auth.ts               # Better Auth config
  logger.ts             # Pino logger with trace context
  middleware/           # Global middleware
  features/             # Feature modules (one folder per feature)
    {feature}/
      index.ts          # Re-exports feature routes
      routes/           # One file per route handler
  database/
    schema/auth.ts      # Better Auth tables (auto-generated)
    schema/app.ts       # Custom tables (add your tables here)

env.ts                  # Environment schema (Zod)
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
- Use Zod validation with `zValidator`:
```typescript
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const schema = z.object({ name: z.string().min(1) });

export const myRoute = new Hono().get(
  "/",
  zValidator("query", schema),
  async (c) => {
    const { name } = c.req.valid("query");
    return c.json({ message: `Hello, ${name}!` });
  }
);
```

### Database (Drizzle)
- Define tables in `server/database/schema/app.ts`
- Use `drizzle-orm/pg-core` for table definitions
- Reference auth tables from `./auth.ts` for foreign keys

### Environment Variables
- Define in `env.ts` with Zod schemas
- Access via `import env from "@/env"`
- Never hardcode secrets

### i18n
- Add translations to `web/i18n/locales/{lang}/common.ts`
- Use `useTranslation("common")` hook
- Run `bun run check-locale` to verify all keys exist in all locales

### Error Handling
- Use Zod for input validation
- Wrap pages in `<ErrorBoundary>`
- Server errors logged via `logger` from `@/server/logger`

### Logging (Server)
```typescript
import { logger } from "@/server/logger";
logger.info({ userId, action }, "User performed action");
```
Logger auto-injects traceId, spanId, userId when available.

### Tracing (OpenTelemetry)
- HTTP requests, DB queries, and fetch calls are auto-traced
- For custom spans: `import { withSpan } from "@/server/tracing"`

## Adding New Features

**Backend Route:** Create `server/features/{feature}/routes/{route-name}.ts`, re-export in `index.ts`, mount in `server/server.tsx`

**Frontend Page:** Add route to `web/router.tsx`, create component in `web/components/`

**Database Table:** Add to `server/database/schema/app.ts`, run `bun run db:push` (dev) or `db:generate && db:migrate` (prod)

## Better Auth

- Config: `server/auth.ts`
- Client: `web/lib/auth-client.ts`
- After adding plugins: `bun run db:regenerate-auth`
- Session in routes: `await auth.api.getSession({ headers: c.req.raw.headers })`

## API Client (Frontend)

Use type-safe Hono RPC:
```typescript
import { api } from "~/lib/api";
import { useMutation } from "@tanstack/react-query";

const mutation = useMutation(api["my-route"].$get.mutationOptions({}));
mutation.mutate({ query: { name: "World" } });
```
