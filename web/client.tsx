import "@vitejs/plugin-react/preamble";
import "~/styles.css";
import "~/i18n/i18n";
import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./router";

export const createRoot = ViteReactSSG({ routes });
