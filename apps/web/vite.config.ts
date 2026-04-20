import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const root = path.resolve(__dirname);
  const fromFiles = loadEnv(mode, root, "");
  /** Render (and CI) inject env into `process.env`; `loadEnv` only reads `.env*` on disk. */
  const viteApiBase =
    (fromFiles.VITE_API_BASE || process.env.VITE_API_BASE || "").trim() || undefined;
  if (mode === "production" && !viteApiBase) {
    throw new Error(
      "Production build requires VITE_API_BASE (your API origin, e.g. https://wakibet-com-2.onrender.com). " +
        "In Render → Static Site → Environment, add VITE_API_BASE (available at build time), then redeploy.",
    );
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:3000",
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
