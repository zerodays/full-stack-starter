import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { RouteRecord } from "vite-react-ssg";
import App from "./app";
import { ErrorBoundary } from "./components/error-boundary";

const queryClient = new QueryClient();

export const routes: RouteRecord[] = [
  {
    path: "/",
    element: (
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </QueryClientProvider>
    ),
  },
];
