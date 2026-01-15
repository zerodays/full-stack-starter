import type { RouteRecord } from "vite-react-ssg";
import App from "./app";
import { ErrorBoundary } from "./components/error-boundary";

export const routes: RouteRecord[] = [
  {
    path: "/",
    element: (
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    ),
  },
];
