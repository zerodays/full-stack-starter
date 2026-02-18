import path from "node:path";
import devServer from "@hono/vite-dev-server";
import bunAdapter from "@hono/vite-dev-server/bun";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { preventImports } from "./vite-plugins";

export default defineConfig(({ command }) => {
  const resolveConfig = {
    alias: {
      "@": path.resolve(__dirname, "."),
      "~": path.resolve(__dirname, "./web"),
    },
  };

  return {
    resolve: resolveConfig,
    build: {
      minify: true,
      ssr: true, // Optimizes for Bun/Node
      outDir: "dist-server", // Server builds to dist-server
      emptyOutDir: true, // Clean the server output folder
      rollupOptions: {
        input: "./server/server.ts",
        output: {
          entryFileNames: "_worker.js",
        },
      },
    },
    server: {
      watch: {
        ignored: ["**/.direnv/**", "**/.git/**", "**/node_modules/**"],
      },
    },
    optimizeDeps: {
      entries: ["./web/client.ts", "./web/app.tsx"],
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
      tailwindcss(),
      command === "serve" ? react() : undefined,
      devServer({
        entry: "./server/server.ts",
        adapter: bunAdapter(),
      }),
    ],
    test: {
      exclude: ["**/node_modules/**", "**/.direnv/**"],
      server: {
        deps: {
          inline: ["zod"],
        },
      },
    },
  };
});
