/**
 * Render static sites (and similar CDNs) only have real files per URL unless you
 * add a dashboard rewrite. Render also serves ./404.html for unknown paths.
 * Copy the built index.html so deep links like /contact load the SPA.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirname, "..", "dist");
const indexPath = path.join(dist, "index.html");

if (!fs.existsSync(indexPath)) {
  console.error("[copySpaFallbacks] dist/index.html missing; run vite build first.");
  process.exit(1);
}

const html = fs.readFileSync(indexPath, "utf8");

fs.writeFileSync(path.join(dist, "404.html"), html);

const routes = ["contact", "scoring-table", "terms", "privacy", "responsible-play", "pick-teams", "rosters"];
for (const r of routes) {
  const dir = path.join(dist, r);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

console.log("[copySpaFallbacks] wrote 404.html and route shells for:", routes.join(", "));
