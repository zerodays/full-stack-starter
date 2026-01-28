<p align="center">
  <img src="docs/assets/title.svg" width="100%" alt="Banner Title">
</p>

# Full Stack Starter

A modern full-stack starter template with React, Hono, and Capacitor for building web and native mobile apps.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | [Bun](https://bun.sh/) |
| **Frontend** | [React 19](https://react.dev/) + [Vite](https://vite.dev/) |
| **Backend** | [Hono](https://hono.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) + [Drizzle ORM](https://orm.drizzle.team/) |
| **Auth** | [Better Auth](https://www.better-auth.com/) |
| **Observability** | [OpenTelemetry](https://opentelemetry.io/) + [Axiom](https://axiom.co/) |
| **i18n** | [i18next](https://www.i18next.com/) |
| **Validation** | [Zod](https://zod.dev/) |
| **Linting** | [Biome](https://biomejs.dev/) |

## Prerequisites

- [Bun](https://bun.sh/) v1.0+
- [Docker](https://www.docker.com/) (for PostgreSQL)
- [Infisical CLI](https://infisical.com/docs/cli/overview) (for environment variables)

## Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Setup Environment Variables

Configure your Infisical project or create a `.env` file with required variables.

### 3. Start Development Server

```bash
bun dev
```

This command starts the following services:
- **PostgreSQL**: Database service on port `5432`.
- **Migrator**: Automatically runs pending migrations.
- **Vite**: Development server with Hot Module Replacement at [localhost:5173](http://localhost:5173/).
- **Drizzle Studio**: Database GUI at [local.drizzle.studio](https://local.drizzle.studio)

The Vite server and Drizzle Studio run inside Docker containers. To ensure the stack remains fast, a custom development image is used. We bind the current directory to a Docker volume, so code changes are immediately reflected in the container.

**Note on dependencies**: Since `node_modules` are cached, you must rebuild the containers if you add or change packages. You can do this by running:

```bash
bun dev --build
```

## Scripts

| Script | Description |
|--------|-------------|
| `bun dev` | Start full development environment |
| `bun run build` | Build for production |
| `bun start` | Run production server |
| `bun run all` | Run all CI checks locally |
| `bun run typecheck` | Type-check the entire project |
| `bun run lint` | Fix linting issues |
| `bun run lint:check` | Check code with Biome |
| `bun run format` | Fix formatting issues |
| `bun run format:check` | Check formatting |

### Database

| Script | Description |
|--------|-------------|
| `bun run db:start` | Start PostgreSQL container |
| `bun run db:studio` | Open Drizzle Studio |
| `bun run db:reset` | Reset database (destroys all data) |
| `bun run db:push` | Sync schema to DB (dev only, no migrations) |
| `bun run db:generate` | Generate migration files from schema changes |
| `bun run db:migrate` | Apply pending migrations |
| `bun run db:regenerate-auth` | Regenerate Better Auth schema |
| `bun run import:staging` | Import data from staging |

**Workflow:**
- **Development:** Use `db:push` for fast iteration (no migration files)
- **Staging/Production:** Use `db:generate` + `db:migrate` (tracked, reviewable changes)

Re-run `db:regenerate-auth` when adding Better Auth plugins or upgrading.

**Schema files:**
- `server/database/schema/auth.ts` - Auto-generated (safe to overwrite)
- `server/database/schema/app.ts` - Your custom tables (never overwritten)

## Project Structure

```
├── web/                     # Frontend (React)
│   ├── app.tsx              # Main app component
│   ├── client.tsx           # Client entry point
│   ├── router.tsx           # Route definitions
│   ├── components/          # UI components
│   ├── lib/
│   │   ├── api.ts           # Hono RPC client (type-safe API calls)
│   │   └── auth-client.ts   # Better Auth client
│   ├── i18n/                # Internationalization
│   └── styles.css           # Global styles
├── server/                  # Backend (Hono)
│   ├── server.ts            # Server entry point & route assembly
│   ├── lib/                 # Shared utilities
│   │   ├── auth.ts          # Better Auth configuration
│   │   ├── logger.ts        # Pino logger with trace context
│   │   ├── router.ts        # Typed Hono router factory
│   │   ├── tracing.ts       # OpenTelemetry tracing helpers
│   │   ├── request-context.ts # AsyncLocalStorage request context
│   │   └── instrumentation.ts # Node SDK setup
│   ├── middleware/          # Hono middleware
│   │   ├── auth.middleware.ts # User context middleware
│   │   └── db.middleware.ts   # Database middleware
│   ├── features/            # Feature modules
│   │   ├── auth/            # Auth routes (Better Auth handler)
│   │   ├── health/          # Health check
│   │   └── demo/            # Demo routes
│   │       └── routes/      # Route handlers (one file per route)
│   └── database/
│       ├── index.ts         # Drizzle connection
│       └── schema/
│           ├── auth.ts      # Better Auth tables (auto-generated)
│           ├── app.ts       # Your custom tables
│           └── index.ts     # Re-exports all tables
├── lib/                     # Shared utilities
│   └── tracing.ts           # OpenTelemetry helpers
├── docs/                    # Documentation
├── scripts/                 # Utility scripts
└── env.ts                   # Environment schema (Zod)
```

## CI

GitHub Actions runs on every push and PR to `master`:

- Format check
- Lint
- Type check
- Build

## Documentation

| Guide | Description |
|-------|-------------|
| [OpenTelemetry Guide](./docs/otel-guide.md) | How to add tracing to your code |
| [OpenTelemetry Architecture](./docs/otel-architecture.md) | Why the setup is structured this way |
| [Capacitor Guide](./docs/capacitor.md) | Building native iOS/Android apps |

## TODO

- [ ] DB sync from staging (implement `scripts/import-staging.sh`)
- [ ] Sentry frontend integration
