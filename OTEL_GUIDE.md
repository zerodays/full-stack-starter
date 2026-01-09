# OpenTelemetry & Axiom Integration Guide

We have successfully integrated full-stack OpenTelemetry (OTel) tracing, exporting data to **Axiom**.

## 🚀 Overview

This setup allows us to track a request from the user's browser (Frontend) all the way through to the backend (Hono/Bun), linked via a single Distributed Trace.

- **Frontend**: Captures page loads, fetches, and interactions. Sends traces to a local proxy to keep API keys secure.
- **Backend**: Captures API handling, database queries (simulated), and acts as a proxy for frontend traces.
- **Axiom**: Acts as the centralized storage and visualization tool for all traces.

## 🛠 What We Implemented

### 1. Dependencies
We installed the necessary OTel SDKs for both Node/Bun and the Web:
- **Backend**: `@opentelemetry/sdk-node`, `@opentelemetry/exporter-trace-otlp-proto`.
- **Frontend**: `@opentelemetry/sdk-trace-web`, `@opentelemetry/exporter-trace-otlp-http`.

### 2. Environment Configuration
New environment variables added to `env.ts`:
- `AXIOM_TOKEN`: Your private Axiom API Token.
- `AXIOM_DATASET`: The Axiom dataset name (must be type "Events").
- `OTEL_SERVICE_NAME`: Service identity (default: `full-stack-starter`).

### 3. Backend Instrumentation
- **Initialization**: `server/instrumentation.ts` sets up the NodeSDK and OTLP exporter.
- **Middleware**: A custom Hono middleware in `server/server.tsx` manually extracts `traceparent` headers from incoming requests and starts a server-side span. This ensures Bun's HTTP handling is properly traced.
- **Proxy Endpoint**: `POST /api/otel/v1/traces` forwards frontend traces to Axiom, keeping the `AXIOM_TOKEN` server-side.

### 4. Frontend Instrumentation
- **Initialization**: `web/instrumentation.ts` sets up `WebTracerProvider`.
- **Auto-Instrumentation**:
  - `DocumentLoadInstrumentation`: Tracks page load performance.
  - `FetchInstrumentation`: Automatically adds `traceparent` headers to outgoing API calls (CORS configured).

### 5. Demo Feature
- Added `GET /api/demo-trace` endpoint with an artificial delay.
- Added a **"Trigger OpenTelemetry Trace"** button in the frontend to demonstrate the full trace waterfall.

## ✅ How to Run & Verify

1.  **Configure `.env`**:
    ```bash
    AXIOM_TOKEN="xapt-..."
    AXIOM_DATASET="full-stack-traces"
    ```
2.  **Start the App**:
    ```bash
    bun run dev
    ```
3.  **Generate a Trace**:
    - Open the app.
    - Click **"Trigger OpenTelemetry Trace"**.
4.  **View in Axiom**:
    - Go to the **Explore** tab.
    - Select your dataset.
    - You will see a trace combining `full-stack-starter-web` (Client) and `full-stack-starter` (Server).

## 📝 Remaining Work / TODOs

While the foundation is solid, here is what can be improved:

- [ ] **Database Instrumentation**: Add automatic tracing for Drizzle/Postgres queries (requires `@opentelemetry/instrumentation-pg`).
- [ ] **Metrics**: Currently we only send *Traces*. We need to configure `MetricReader` to send numerical data (CPU, Memory, Request Counts) to Axiom's `MetricsDB`.
- [ ] **Error Context**: Improve error attribute capture in the backend middleware (ensure stack traces are formatted nicely for Axiom).
- [ ] **Production Tuning**: Review sampling rates. Currently, we sample 100% of traces (default), which might be expensive in high-traffic production.
- [ ] **Deployment**: Ensure `AXIOM_TOKEN` is properly set in your deployment provider (e.g., Vercel/Fly/Railway).

---
*Created by opencode*
