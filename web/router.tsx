import type { RouteRecord } from "vite-react-ssg";
import App from "./app";

export const routes: RouteRecord[] = [
  {
    path: "/",
    Component: App,
    errorElement: (
      <div className="flex h-screen w-screen items-center justify-center font-black text-4xl text-red-500">
        Error
      </div>
    ),
  },
];
