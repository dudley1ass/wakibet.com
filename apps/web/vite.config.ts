import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const root = path.resolve(__dirname);
  const fromFiles = loadEnv(mode, root, "");
  /** Render (and CI) inject env into `process.env`; `loadEnv` only reads `.env*` on disk. */
  const viteApiBase =
    (fromFiles.VITE_API_BASE || process.env.VITE_API_BASE || "").trim() || undefined;
  if (mode === "production" && !viteApiBase) {
    console.warn(
      "[wakibet-web] VITE_API_BASE is missing at build time. The site will deploy, " +
        "and will use the in-app fallback API origin. Set VITE_API_BASE in Render Static Site env and redeploy.",
    );
  }

  return {
    plugins: [react(), tailwindcss()],
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
        "@wakibet/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
      },
    },
  };
});
