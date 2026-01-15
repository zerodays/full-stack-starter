import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch"; // <--- IMPORT THIS
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
// import { TraceIdRatioBasedSampler } from "@opentelemetry/sdk-trace-base";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from "@opentelemetry/semantic-conventions";
import env from "@/env";

if (env.AXIOM_TOKEN && env.AXIOM_DATASET) {
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
      [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: env.ENV,
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
        propagateTraceHeaderCorsUrls: [/.+/], // Propagate headers to all domains (or restrict to your internal APIs)
      }),
    ],
  });

  try {
    sdk.start();
    console.log("OpenTelemetry initialized with Axiom");

    // Graceful shutdown to flush pending traces (production only)
    // In dev mode, concurrently handles process management
    if (process.env.NODE_ENV === "production") {
      const shutdown = () => {
        sdk
          .shutdown()
          .then(() => console.log("OpenTelemetry SDK shut down"))
          .catch((e) =>
            console.error("Error shutting down OpenTelemetry SDK", e),
          )
          .finally(() => process.exit(0));

        // Force exit after 2s if shutdown hangs
        setTimeout(() => process.exit(0), 2000);
      };

      process.on("SIGTERM", shutdown);
      process.on("SIGINT", shutdown);
    }
  } catch (e) {
    console.error("Error initializing OpenTelemetry", e);
  }
}
