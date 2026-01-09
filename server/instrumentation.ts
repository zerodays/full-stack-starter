import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
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
    }),
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  try {
    sdk.start();
    console.log("OpenTelemetry initialized with Axiom");
  } catch (e) {
    console.error("Error initializing OpenTelemetry", e);
  }
}
