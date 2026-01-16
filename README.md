<p align="center">
  <img src="title.svg" width="100%" alt="Banner Title">
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

This command starts:
- PostgreSQL database (via Docker)
- Vite dev server with HMR
- Drizzle Studio for database management

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
| `bun run import:staging` | Import data from staging |

## Project Structure

```
├── web/                 # Frontend (React)
│   ├── app.tsx          # Main app component
│   ├── client.tsx       # Client entry point
│   ├── router.tsx       # Route definitions
│   ├── components/      # UI components
│   ├── i18n/            # Internationalization
│   └── styles.css       # Global styles
├── server/              # Backend (Hono)
│   ├── server.tsx       # Server entry point
│   ├── logger.ts        # Pino logger with trace context
│   └── db/              # Database schema & config
├── lib/                 # Shared utilities
│   └── tracing.ts       # OpenTelemetry helpers
├── docs/                # Documentation
├── scripts/             # Utility scripts
└── env.ts               # Environment schema (Zod)
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
