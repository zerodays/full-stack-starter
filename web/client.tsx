import "@vitejs/plugin-react/preamble";
import { initInstrumentation } from "./instrumentation";

initInstrumentation();

import "~/styles.css";
import "~/i18n/i18n";
import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./router";

export const createRoot = ViteReactSSG({ routes });
