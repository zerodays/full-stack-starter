# OpenTelemetry Architecture

This document covers how OpenTelemetry is set up in this repo, why certain decisions were made, and what's left to do.

For practical "how to add tracing" examples, see [OTEL_GUIDE.md](./OTEL_GUIDE.md).

---

## Architecture

```
┌─────────────────┐       traceparent header        ┌─────────────────┐
│     Browser     │ ─────────────────────────────▶  │   Hono Server   │
│    (React)      │                                 │   (Bun)         │
│                 │                                 │                 │
│  web/           │                                 │  server/        │
│  instrumentation│                                 │  instrumentation│
│  .ts            │                                 │  .ts            │
└────────┬────────┘                                 └────────┬────────┘
         │                                                   │
         │ POST /api/otel/v1/traces                          │ OTLP proto
         │                                                   │
         ▼                                                   ▼
┌─────────────────┐                                 ┌─────────────────┐
│  Trace Proxy    │ ──────────────────────────────▶ │     Axiom       │
│  (server.tsx)   │         OTLP HTTP               │                 │
└─────────────────┘                                 └─────────────────┘
```

**Service names:** `web` (frontend) and `server` (backend)

---

## Bun vs Node.js: Why this setup is different

### The problem

In a standard **Node.js + Express** app, you'd just use `@opentelemetry/instrumentation-http`. This library monkey-patches Node's native `http` module. Since Express uses `http` internally, you get automatic tracing of incoming requests for free.

**Bun doesn't use Node's `http` module.** It has its own high-performance HTTP server (`Bun.serve`). This means:
- `@opentelemetry/instrumentation-http` does nothing for incoming requests
- The standard Node.js auto-instrumentation doesn't create "entry spans" for your routes

### The solution

We manually implement the entry span logic in a Hono middleware (`server/server.tsx`):

1. **Extract** the `traceparent` header from incoming requests
2. **Create** a span for the HTTP request
3. **Propagate** the context so child spans (DB queries, etc.) are linked

This is the same thing `instrumentation-http` would do, just done manually.

### What works with Bun

Library-level instrumentations work fine because they patch npm packages, not Node internals:
- `@opentelemetry/instrumentation-pg` - PostgreSQL queries ✓
- `@opentelemetry/instrumentation-redis` - Redis commands ✓
- `@opentelemetry/instrumentation-mongodb` - MongoDB queries ✓
- Any other library instrumentation - just install the library and it auto-traces

We disable only the 4 Node.js core module patches that conflict with Bun:
- `instrumentation-http` - we handle incoming requests manually in middleware
- `instrumentation-fs` - patches Node's fs module
- `instrumentation-dns` - patches Node's dns module
- `instrumentation-net` - patches Node's net module

### Critical: Import order in server.tsx

The instrumentation import **must** be first so it can patch modules before they're loaded:

```typescript
// IMPORTANT: Instrumentation must be first
import "@/server/instrumentation";

import { db } from "@/server/db";  // pg is patched before this loads
```

We've disabled biome's import organizer for this file to preserve the order.

---

## File structure

| File | Purpose |
|------|---------|
| `web/instrumentation.ts` | Browser SDK setup (WebTracerProvider, fetch/document-load auto-instrumentation) |
| `web/tracing.ts` | Frontend helpers: `withSpan`, `addSpanAttributes`, `recordSpanError` |
| `web/client.tsx` | Calls `initInstrumentation()` before app loads |
| `server/instrumentation.ts` | Node SDK setup (auto-instrumentations, Axiom exporter) |
| `server/server.tsx` | Hono middleware for entry spans + trace proxy endpoint |
| `server/tracing.ts` | Backend helpers: `withSpan`, `addSpanAttributes`, `recordSpanError` |
| `env.ts` | OTEL config schema (AXIOM_TOKEN, AXIOM_DATASET, OTEL_SERVICE_NAME) |

---

## Configuration

| Env var | Default | Description |
|---------|---------|-------------|
| `AXIOM_TOKEN` | - | Axiom API token (required for tracing to work) |
| `AXIOM_DATASET` | - | Axiom dataset name (required for tracing to work) |
| `OTEL_SERVICE_NAME` | `server` | Backend service name in traces |

Frontend service name is hardcoded to `web` (set in vite.config.ts).

Without `AXIOM_TOKEN` and `AXIOM_DATASET`, tracing is silently disabled.

---

## TODO

### Ready to enable (just uncomment)

- [ ] **User context injection** - Uncomment the Better Auth integration in `server/server.tsx` once auth is set up. Automatically adds `user.id` and `user.email` to every request span.

### High priority

- [ ] **Trace authentication flows** - Add spans around login, logout, session refresh
- [ ] **Error boundary integration** - Capture React error boundaries as spans with full component stack

### Medium priority

- [ ] **Add resource attributes** - Include `service.version`, `deployment.environment` for better filtering
- [ ] **Trace database migrations** - Wrap Drizzle migrations in spans
- [ ] **Add frontend performance metrics** - Web Vitals (LCP, FID, CLS) as span attributes

### Nice to have

- [ ] **Custom Axiom dashboard** - Pre-built queries for common debugging scenarios
- [ ] **Sampling configuration** - Uncomment in `server/instrumentation.ts` when traffic grows
- [ ] **Trace-aware logging** - Include trace IDs in console logs for correlation

### Won't do (for now)

- **Metrics** - Axiom handles this differently; traces are enough for now
- **OTEL Collector** - Direct-to-Axiom is simpler; collector adds operational overhead
- **Jaeger/Zipkin support** - Axiom-only for now; can abstract exporter later if needed

---

## Resources

- [OpenTelemetry JS Documentation](https://opentelemetry.io/docs/languages/js/)
- [Axiom OpenTelemetry Guide](https://axiom.co/docs/send-data/opentelemetry)
- [Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/) - Standard attribute names
