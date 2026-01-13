# OpenTelemetry Guide

This app uses OpenTelemetry to trace requests from browser to database. Traces are exported to Axiom.

**Service names in Axiom:** `web` (frontend) and `server` (backend)

---

## What's automatic (zero code needed)

| Layer | What's traced |
|-------|--------------|
| Frontend | Page loads, all `fetch()` calls |
| Backend | All HTTP requests, PostgreSQL queries |
| Cross-service | Trace context propagation via `traceparent` header |

**You don't need to add any tracing code for basic visibility.** The middleware and auto-instrumentation handle it.

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

## Testing locally

1. Set `AXIOM_TOKEN` and `AXIOM_DATASET` in `.env`
2. Run the app: `bun dev`
3. Trigger some actions
4. Check Axiom dashboard for traces

Without Axiom configured, traces are silently dropped (no errors).
