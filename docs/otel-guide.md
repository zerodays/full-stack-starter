# OpenTelemetry Guide

This app uses OpenTelemetry to trace requests from browser to database. Traces are exported to Axiom.

**Service names in Axiom:** `web` (frontend) and `server` (backend)

---

## What's automatic (zero code needed)

| Layer | What's traced |
|-------|--------------|
| Frontend | Page loads, all `fetch()` and XHR (axios) calls |
| Backend | All incoming HTTP requests, outgoing `fetch()` calls, PostgreSQL queries |
| Cross-service | Trace context propagation via `traceparent` header |

**You don't need to add any tracing code for basic visibility.** The `@hono/otel` middleware and auto-instrumentation handle it.

---

## When to add manual tracing

Only add manual spans when you want to:
- Group related operations under a business concept (e.g., "checkout flow")
- Trace external API calls (Stripe, SendGrid, etc.)
- Add business context you can filter by (user tier, feature flags, etc.)

---

## Backend: Using `withSpan`

Import the helper:
```typescript
import { withSpan, addSpanAttributes } from "@/server/tracing";
```

### Basic usage

```typescript
const result = await withSpan("order.process", async (span) => {
  span.setAttribute("order.id", orderId);
  return await processOrder(orderId);
});
```

### With attributes upfront (cleaner)

```typescript
const result = await withSpan(
  "stripe.charge",
  { "stripe.amount": amount, "stripe.currency": "usd" },
  async () => {
    return await stripe.charges.create({ amount, currency: "usd" });
  }
);
```

### Add context to current request (no new span)

```typescript
app.get("/api/projects/:id", async (c) => {
  const project = await db.query.projects.findFirst({ where: ... });

  // Add context to the existing request span
  addSpanAttributes({
    "project.id": project.id,
    "project.plan": project.plan,
  });

  return c.json(project);
});
```

---

## Frontend: Using `withSpan`

Import the helper:
```typescript
import { withSpan, addSpanAttributes } from "~/tracing";
```

### Basic usage

```typescript
await withSpan("checkout.submit", async (span) => {
  span.setAttribute("cart.items", items.length);
  await submitOrder();
});
```

### With attributes upfront (cleaner)

```typescript
await withSpan(
  "checkout.submit",
  { "cart.items": items.length, "cart.total": total },
  async () => {
    await fetch("/api/checkout", { method: "POST", body: JSON.stringify(cart) });
  }
);
```

---

## Common patterns

### External API call
```typescript
await withSpan(
  "external.sendgrid.send",
  { "email.to": recipient, "email.template": templateId },
  async () => {
    await sendgrid.send({ to: recipient, templateId });
  }
);
```

### Batch operation
```typescript
await withSpan(
  "batch.import_users",
  { "batch.size": users.length },
  async (span) => {
    for (const user of users) {
      await createUser(user);
    }
    span.setAttribute("batch.success_count", users.length);
  }
);
```

### Handled error (still want visibility)
```typescript
import { recordSpanError } from "@/server/tracing";

try {
  await riskyOperation();
} catch (e) {
  recordSpanError(e as Error);
  return fallbackValue; // Error is recorded but we continue
}
```

---

## Logging with trace and user context

Use the logger to automatically include `traceId`, `spanId`, and user info in every log entry:

```typescript
import { logger } from "@/server/logger";

// Basic logging
logger.info("User logged in");

// With structured data
logger.info({ plan: "pro" }, "User upgraded");

// Log levels: trace, debug, info, warn, error, fatal
logger.error({ err: error }, "Payment failed");
```

**Output when inside an authenticated, traced request:**
```json
{"level":30,"traceId":"abc123...","spanId":"def456...","userId":"user_123","userEmail":"user@example.com","msg":"User upgraded"}
```

Context is injected automatically:
- `traceId`/`spanId` - from active OpenTelemetry span
- `userId`/`userEmail` - from authenticated session (via request context middleware)

This lets you search logs by trace ID or user ID in your logging platform.

**Note:** Logs go to stdout, not Axiom. Your hosting platform captures them. Use `LOG_LEVEL` env var to control verbosity (default: `info`).

---

## Span events

Events are timestamped markers *within* a span. Use them for milestones, retries, or state changes:

```typescript
await withSpan("order.process", async (span) => {
  span.addEvent("validation.started");
  await validate(order);
  span.addEvent("validation.passed");

  span.addEvent("payment.started", { "payment.method": "stripe" });
  await charge(order);
  span.addEvent("payment.completed", { "payment.id": chargeId });
});
```

Or add events to the current span without creating a new one:

```typescript
import { trace } from "@opentelemetry/api";

const span = trace.getActiveSpan();
span?.addEvent("cache.miss", { "cache.key": "user:123" });
```

Events appear as markers on the span timeline in Axiom.

**Events vs Logs:**
- Events = part of the trace, visible in Axiom span details
- Logs = separate stream, searchable by trace ID

---

## Testing locally

1. Set `AXIOM_TOKEN` and `AXIOM_DATASET` in `.env`
2. Run the app: `bun dev`
3. Trigger some actions
4. Check Axiom dashboard for traces

Without Axiom configured, traces are silently dropped (no errors).
