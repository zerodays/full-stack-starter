# OpenTelemetry (OTel) Implementation Guide

This repository implements a **production-grade**, full-stack OpenTelemetry setup. It connects user interactions in the browser to backend operations and database queries into a single, distributed trace, exported to **Axiom**.

## 🚀 Architecture Overview

1.  **Frontend (React)**: Captures user interactions (clicks, page loads) and network requests.
2.  **Trace Proxy**: A backend endpoint (`/api/otel/*`) that forwards frontend traces to Axiom. This keeps your API keys secret.
3.  **Backend (Hono + Bun)**: Captures API handling and database operations.
4.  **Context Propagation**: The `traceparent` HTTP header links the Frontend and Backend traces together.

---

## 💻 Frontend Implementation

### 1. Initialization (`web/instrumentation.ts`)
We use the `WebTracerProvider` with two key auto-instrumentations:
-   **`DocumentLoadInstrumentation`**: Tracks page load performance.
-   **`FetchInstrumentation`**: Automatically injects the `traceparent` header into outgoing API calls.

**Crucial Detail**: We use `ZoneContextManager`. This is required in JS/TS to keep track of the "current span" across asynchronous operations (Promises/`await`).

### 2. Manual Tracing ("Wide Events")
While auto-instrumentation covers HTTP requests, we often want to track business logic or user intent (e.g., "User clicked Buy"). We do this manually to create **"Wide Events"**—spans with rich context.

**Example: Tracing a Button Click**
```typescript
// web/app.tsx
import { trace } from "@opentelemetry/api";

const triggerTrace = async () => {
  const tracer = trace.getTracer("full-stack-starter-web");
  
  // Start a new Root Span for this interaction
  await tracer.startActiveSpan("ui.interaction.click_demo_button", async (span) => {
    try {
      // Add Attributes (Context) -> This makes it a "Wide Event"
      span.setAttribute("component", "App");
      span.setAttribute("event", "click");
      span.setAttribute("user.tier", "pro"); // Example

      // Perform actions (the fetch trace will automatically become a child of this span)
      await fetch("/api/demo-trace");
      
    } catch (e) {
      // Capture errors on the span
      span.recordException(e as Error);
    } finally {
      // Always end the span!
      span.end();
    }
  });
};
```

---

## 🔙 Backend Implementation (Bun + Hono)

### 1. Initialization (`server/instrumentation.ts`)
We use `@opentelemetry/sdk-node` to initialize the OTel SDK *before* the app starts.

### 2. Hono Middleware (The "Bun Adapter")
In a standard Node.js Express app, OTel would automatically trace incoming HTTP requests. However, because we are using **Bun** and **Hono**, we need a custom middleware to extract the trace context from the frontend.

**`server/server.tsx` Middleware Logic:**
1.  **Extract**: Reads `traceparent` header from the request.
2.  **Start Span**: Starts a new span representing the server processing time.
3.  **Set Context**: Wraps the execution so any downstream spans (DB calls) become children of this request.

### 3. Nested Spans
To break down a long request into measurable steps, use nested spans:

```typescript
// server/server.tsx
app.get("/api/demo-trace", async (c) => {
  const tracer = trace.getTracer("my-service");

  return await tracer.startActiveSpan("parent-operation", async (span) => {
    
    // Create a child span for a specific sub-task
    await tracer.startActiveSpan("database.query", async (dbSpan) => {
      dbSpan.setAttribute("db.statement", "SELECT * FROM users");
      await db.query(...)
      dbSpan.end();
    });

    span.end();
    return c.json({ status: "ok" });
  });
});
```

---

## ⚠️ Bun vs. Node.js: The "Pitfalls"

### Why is this setup different from a standard Node.js app?

In a standard **Node.js** environment, you would simply use `@opentelemetry/instrumentation-http`. This library "monkey-patches" the native `http` module. Since frameworks like Express build on top of `http`, you get tracing for free—no middleware required.

**The Bun Difference:**
Bun implements its own high-performance HTTP server (`Bun.serve`). It does **not** use Node's `http` module internally. Therefore, the standard OTel Node.js auto-instrumentation **does not work** for incoming HTTP requests in Bun.

**The Solution:**
We manually implement the "Entry Span" logic in a Hono middleware. This gives us full control and ensures traces are connected, bridging the gap until Bun has native OTel support or OTel releases a specific Bun instrumentation.

---

## ✅ Checklist for New Features

When adding a new feature, follow this checklist to ensure visibility:

1.  **Frontend**: Does this action initiate a meaningful user journey?
    *   *Yes*: Wrap the event handler in `tracer.startActiveSpan`.
    *   *No*: Let `FetchInstrumentation` handle the network calls automatically.
2.  **Backend**: Does the route perform complex logic or DB queries?
    *   *Yes*: Add child spans (`tracer.startActiveSpan`) around heavy operations (DB queries, external API calls).
    *   *No*: The basic middleware span is likely enough.
3.  **Attributes**: Did you add relevant IDs? (e.g., `user.id`, `order.id`, `project.id`). This allows you to filter effectively in Axiom.
