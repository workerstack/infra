import { readFileSync } from "node:fs";
import { join } from "node:path";

import { z } from "zod";

function manifestSchema() {
  return z.object({ scripts: z.record(z.string(), z.string()).default({}) });
}

/** The scripts in the package's `package.json`. */
export function packageScripts(packageDir: string): Record<string, string> {
  return manifestSchema().parse(JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"))).scripts;
}
