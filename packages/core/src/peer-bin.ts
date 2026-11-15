import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import { z } from "zod";

/** The absolute path of `bin` in the `pkg` package installed for `root`. */
export function peerBin(root: string, pkg: string, bin: string): string {
  const manifestPath = locateManifest(root, pkg);
  const path = parseBin(readFileSync(manifestPath, "utf8"), bin);

  if (path === undefined)
    throw new Error(`the ${pkg} package declares no ${bin} binary; reinstall it with bun add -d ${pkg}`);

  return join(dirname(manifestPath), path);
}

function locateManifest(root: string, pkg: string): string {
  try {
    return createRequire(join(root, "package.json")).resolve(`${pkg}/package.json`);
  } catch {
    throw new Error(`the ${pkg} package is not installed; run bun add -d ${pkg}`);
  }
}

// A package's `bin` is one path or a name-to-path record; a lone path serves the binary asked for.
function parseBin(text: string, bin: string): string | undefined {
  const field = z.union([z.string().transform((path) => ({ [bin]: path })), z.record(z.string(), z.string())]);

  return z.object({ bin: field.optional() }).parse(JSON.parse(text)).bin?.[bin];
}
