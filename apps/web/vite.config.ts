import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const root = path.resolve(__dirname);
  const env = loadEnv(mode, root, "");
  if (mode === "production" && !env.VITE_API_BASE?.trim()) {
    throw new Error(
      "Production build requires VITE_API_BASE (your API origin, e.g. https://wakibet-com-2.onrender.com). " +
        "Set it in Render Static Site → Environment before build, then redeploy.",
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
