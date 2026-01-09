import "@vitejs/plugin-react/preamble";
import "~/styles.css";
import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./router";

export const createRoot = ViteReactSSG({ routes });
