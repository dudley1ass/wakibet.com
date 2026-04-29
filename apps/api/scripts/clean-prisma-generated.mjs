/**
 * Removes apps/api/src/generated/prisma before `prisma generate`.
 * On Windows, Prisma replaces the query engine via rename(); if any process still
 * loads that DLL, rename fails with EPERM. Stopping dev servers first is required;
 * this script clears the folder when possible so generate does not fight an old file.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/generated/prisma");

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  try {
    await fs.access(dir);
  } catch {
    return;
  }

  const lastError = { e: /** @type {unknown} */ (undefined) };
  for (let i = 0; i < 8; i++) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
      return;
    } catch (e) {
      lastError.e = e;
      await sleep(250);
    }
  }

  console.error(
    [
      "Could not remove apps/api/src/generated/prisma (files may be in use).",
      "Stop anything using the Prisma client for this repo (e.g. `pnpm --filter @wakibet/api dev`, other node processes), then retry.",
      "If the project lives under OneDrive, try moving it out or pausing sync; exclude the folder from real-time antivirus scanning if EPERM persists.",
      "",
      String(lastError.e && lastError.e instanceof Error ? lastError.e.message : lastError.e),
    ].join("\n"),
  );
  process.exit(1);
}

await main();
