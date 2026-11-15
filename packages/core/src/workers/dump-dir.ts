import { mkdirSync } from "node:fs";
import { join } from "node:path";

/** `<root>/.tmp/infra/<kind>/`, created on demand: where a command leaves what it fetched. */
export function dumpDir(root: string, kind: string): string {
  const dir = join(root, ".tmp/infra", kind);

  mkdirSync(dir, { recursive: true });

  return dir;
}
