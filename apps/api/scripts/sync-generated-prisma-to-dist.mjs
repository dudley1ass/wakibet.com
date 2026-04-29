/**
 * tsc emits imports like `../generated/prisma/index.js` from dist/lib/*.js,
 * which resolve to dist/generated/prisma (not src). Copy the Prisma output there after build.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "src/generated/prisma");
const destDir = path.join(root, "dist/generated/prisma");

try {
  await fs.access(srcDir);
} catch {
  console.error(`Expected Prisma client at ${srcDir}. Run prisma generate first.`);
  process.exit(1);
}

await fs.mkdir(path.dirname(destDir), { recursive: true });
await fs.cp(srcDir, destDir, { recursive: true, force: true });
