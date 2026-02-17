import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
});
