import { SpanStatusCode, trace } from "@opentelemetry/api";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that captures React errors and reports them to OpenTelemetry.
 *
 * Wrap your app or critical sections with this component to:
 * - Catch render errors that would otherwise crash the app
 * - Record errors as spans with component stack traces
 * - Show a fallback UI instead of a white screen
 *
 * @example
 * <ErrorBoundary fallback={<ErrorPage />}>
 *   <App />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const tracer = trace.getTracer("web");

    tracer.startActiveSpan("react.error_boundary", (span) => {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });

      span.setAttribute("error.type", error.name);
      span.setAttribute("error.message", error.message);

      if (error.stack) {
        span.setAttribute("error.stack", error.stack);
      }

      if (errorInfo.componentStack) {
        span.setAttribute("react.component_stack", errorInfo.componentStack);
      }

      span.recordException(error);
      span.end();
    });

    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-4">
          <h1 className="font-bold text-4xl text-red-500">
            Something went wrong
          </h1>
          <p className="text-gray-600">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded bg-gray-900 px-4 py-2 text-white hover:bg-gray-800"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
