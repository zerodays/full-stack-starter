import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
// import { TraceIdRatioBasedSampler } from "@opentelemetry/sdk-trace-base";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { ATTR_DEPLOYMENT_ENVIRONMENT_NAME } from "@opentelemetry/semantic-conventions/incubating";
import env from "@/env";

if (env.AXIOM_TOKEN && env.AXIOM_DATASET) {
  // Only propagate trace headers to our own domain to avoid leaking context to third parties
  const appHost = new URL(env.BETTER_AUTH_URL).host;
  const internalDomainsPattern = new RegExp(
    `^https?://${appHost.replace(/\./g, "\\.")}`,
  );

  const exporter = new OTLPTraceExporter({
    url: "https://api.axiom.co/v1/traces",
    headers: {
      Authorization: `Bearer ${env.AXIOM_TOKEN}`,
      "x-axiom-dataset": env.AXIOM_DATASET,
    },
  });

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: env.OTEL_SERVICE_NAME,
      [ATTR_SERVICE_VERSION]: env.SERVICE_VERSION,
      [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: env.ENV,
    }),
    traceExporter: exporter,
    // Uncomment to enable sampling when traffic increases:
    // sampler: new TraceIdRatioBasedSampler(0.1), // Sample 10% of traces
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable Node.js core module patches that don't work with Bun
        "@opentelemetry/instrumentation-http": { enabled: false }, // We handle incoming requests manually in middleware
        "@opentelemetry/instrumentation-fs": { enabled: false },
        "@opentelemetry/instrumentation-dns": { enabled: false },
        "@opentelemetry/instrumentation-net": { enabled: false },
      }),
      new FetchInstrumentation({
        ignoreNetworkEvents: true,
        propagateTraceHeaderCorsUrls: [internalDomainsPattern],
        // Ignore empty URLs (Better Auth makes internal calls with empty URLs)
        ignoreUrls: [/^$/],
      }),
    ],
  });

  try {
    sdk.start();
    console.log("OpenTelemetry initialized with Axiom");

    // Graceful shutdown to flush pending traces (production only)
    // In dev mode, concurrently handles process management
    if (env.ENV === "production") {
      const shutdown = () => {
        // Force exit after 5s if shutdown hangs
        const forceExitTimeout = setTimeout(() => {
          console.error("OpenTelemetry SDK shutdown timed out, forcing exit");
          process.exit(1);
        }, 5000);

        sdk
          .shutdown()
          .then(() => console.log("OpenTelemetry SDK shut down"))
          .catch((e) =>
            console.error("Error shutting down OpenTelemetry SDK", e),
          )
          .finally(() => {
            clearTimeout(forceExitTimeout);
            process.exit(0);
          });
      };

      process.on("SIGTERM", shutdown);
      process.on("SIGINT", shutdown);
    }
  } catch (e) {
    console.error("Error initializing OpenTelemetry", e);
  }
} else if (env.ENV === "production") {
  console.warn(
    "OpenTelemetry not initialized: AXIOM_TOKEN and AXIOM_DATASET are required",
  );
}
