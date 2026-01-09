import path from "node:path";
import devServer from "@hono/vite-dev-server";
import bunAdapter from "@hono/vite-dev-server/bun";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode, command }) => {
  const resolveConfig = {
    alias: {
      "@": path.resolve(__dirname, "."),
      "~": path.resolve(__dirname, "./web"),
    },
  };

  if (mode === "client") {
    return {
      resolve: resolveConfig,
      build: {
        // Client builds to dist/ (which creates dist/static based on rollupOptions)
        outDir: "dist",
        emptyOutDir: true, // Cleans the folder first
        rollupOptions: {
          input: ["./web/client.tsx"],
          output: {
            entryFileNames: "static/client.js",
            chunkFileNames: "static/assets/[name]-[hash].js",
            assetFileNames: "static/assets/[name].[ext]",
          },
        },
        copyPublicDir: false,
      },
      plugins: [react(), tailwindcss()],
    };
  } else {
    return {
      resolve: resolveConfig,
      build: {
        minify: true,
        ssr: true, // Optimizes for Bun/Node
        outDir: "dist", // Same output folder
        emptyOutDir: false, // <--- CRITICAL: Don't delete the client files!
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
  }
});
