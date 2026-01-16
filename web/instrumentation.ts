import { ZoneContextManager } from "@opentelemetry/context-zone";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { DocumentLoadInstrumentation } from "@opentelemetry/instrumentation-document-load";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { XMLHttpRequestInstrumentation } from "@opentelemetry/instrumentation-xml-http-request";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { ATTR_DEPLOYMENT_ENVIRONMENT_NAME } from "@opentelemetry/semantic-conventions/incubating";

export function initInstrumentation() {
  if (typeof window === "undefined") return;

  const exporter = new OTLPTraceExporter({
    url: "/api/otel/v1/traces",
  });

  const provider = new WebTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: "web",
      [ATTR_SERVICE_VERSION]: import.meta.env.VITE_SERVICE_VERSION || "dev",
      [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: import.meta.env.MODE,
    }),
    spanProcessors: [new BatchSpanProcessor(exporter)],
  });

  provider.register({
    contextManager: new ZoneContextManager(),
  });

  registerInstrumentations({
    instrumentations: [
      new DocumentLoadInstrumentation(),
      new FetchInstrumentation({
        ignoreUrls: [/.*\/api\/otel\/.*/],
        propagateTraceHeaderCorsUrls: [/.+/],
      }),
      new XMLHttpRequestInstrumentation({
        ignoreUrls: [/.*\/api\/otel\/.*/],
        propagateTraceHeaderCorsUrls: [/.+/],
      }),
    ],
  });

  if (import.meta?.env?.DEV) {
    console.debug("Web instrumentation initialized");
  }
}
