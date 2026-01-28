import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { preventImports } from "./vite-plugins";

export default defineConfig(() => {
  return {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
        "~": path.resolve(__dirname, "./web"),
      },
    },
    build: {
      outDir: "dist-static",
      emptyOutDir: true,
    },
    plugins: [
      // Do not allow server code to be imported into the client build
      preventImports({
        fromFolder: path.resolve(__dirname, "web"),
        folder: path.resolve(__dirname, "server"),
        // For the Hono RPC to work correctly, we need to allow types to be
        // imported from `server.ts` to the client code.
        ignores: ["./server/server.ts"],
      }),
      react(),
      tailwindcss(),
    ],
  };
});
