import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "../src/app.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
/** Monorepo root (`apps/api/scripts` → three levels up). */
const root = join(__dirname, "..", "..", "..");

async function main() {
  const app = await buildApp();
  await app.ready();
  const spec = app.swagger();
  writeFileSync(join(root, "openapi.json"), JSON.stringify(spec, null, 2));
  await app.close();
  console.log("Wrote openapi.json at repo root");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
