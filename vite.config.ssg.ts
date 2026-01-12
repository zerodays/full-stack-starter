import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

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
    plugins: [react(), tailwindcss()],
  };
});
