import { globSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Rewrites each `from "<relative>` import of the `.ts` files under `dir` to `from "<target>/`, so a copy elsewhere
 * still loads the package's source. `target` goes in as a file URL, not a raw path: in a source string a win32
 * path's `\` are escapes, and Node's loader reads its `D:` as a URL scheme.
 */
export function absoluteImports(dir: string, relative: string, target: string): void {
  const url = pathToFileURL(join(target, "/")).href;

  for (const file of globSync("**/*.ts", { cwd: dir })) {
    const path = join(dir, file);

    writeFileSync(path, readFileSync(path, "utf8").replaceAll(`from "${relative}`, `from "${url}`));
  }
}
