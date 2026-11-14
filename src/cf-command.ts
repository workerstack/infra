import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import { z } from "zod";

const JS_FILE = /\.[cm]?js$/;

export type Program = { args: string[]; file: string };

/** The `cf` binary of the package installed for `root`, as a program to spawn with `args` after it. */
export function cfCommand(root: string, args: readonly string[], execPath: string): Program {
  const manifestPath = locateManifest(root);
  const manifest = parseManifest(readFileSync(manifestPath, "utf8"));
  const bin = manifest.bin?.cf;

  if (bin === undefined) throw new Error("the cf package declares no cf binary; reinstall it with bun add -d cf");

  const file = join(dirname(manifestPath), bin);

  return JS_FILE.test(file) ? { args: [file, ...args], file: execPath } : { args: [...args], file };
}

function locateManifest(root: string): string {
  try {
    return createRequire(join(root, "package.json")).resolve("cf/package.json");
  } catch {
    throw new Error("the cf package is not installed; run bun add -d cf");
  }
}

// A package's `bin` is one path or a name-to-path record; both come out as the record.
function parseManifest(text: string): { bin?: Record<string, string> | undefined } {
  const bin = z.union([z.string().transform((path) => ({ cf: path })), z.record(z.string(), z.string())]);

  return z.object({ bin: bin.optional() }).parse(JSON.parse(text));
}
