import { existsSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import { INSTALLED_DIR } from "./cf-config.constants.ts";

const DEV_SERVER = "wrangler";

// The wrangler a package resolves: its own, or the hoisted one above it.
function resolveDevServer(packageDir: string): string {
  return dirname(createRequire(join(packageDir, "package.json")).resolve(`${DEV_SERVER}/package.json`));
}

/**
 * `cf deploy` finds its dev server (wrangler) only in the package's own install directory, and bun's hoisted
 * linker installs it once at the root. This links the one the package resolves into the package; a package with its
 * own copy keeps it. `resolve` answers the install directory; a package that resolves none fails naming it.
 */
export function linkDevServer(packageDir: string, resolve: (packageDir: string) => string = resolveDevServer): void {
  const link = join(packageDir, INSTALLED_DIR, DEV_SERVER);

  if (existsSync(join(link, "package.json"))) return;

  let installed: string;

  try {
    installed = resolve(packageDir);
  } catch {
    throw new Error(`${packageDir}: ${DEV_SERVER} is not installed; run bun install`);
  }

  mkdirSync(dirname(link), { recursive: true });
  // A link left pointing nowhere (its target was removed) is replaced.
  rmSync(link, { force: true, recursive: true });
  symlinkSync(installed, link, "dir");
}
