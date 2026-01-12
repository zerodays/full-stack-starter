import path from "node:path";
import devServer from "@hono/vite-dev-server";
import bunAdapter from "@hono/vite-dev-server/bun";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

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
          input: "./server/server.tsx",
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
        tailwindcss(),
        command === "serve" ? react() : undefined,
        devServer({
          entry: "./server/server.tsx",
          adapter: bunAdapter(),
        }),
      ],
    };
});
