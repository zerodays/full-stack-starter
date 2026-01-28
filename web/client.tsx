// IMPORTANT: Instrumentation must be the FIRST import to patch fetch before
// any other module (like better-auth) captures a reference to it
import "./instrumentation";
import "@vitejs/plugin-react/preamble";

import "~/styles.css";
import "~/i18n/i18n";
import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./router";

export const createRoot = ViteReactSSG({ routes });
