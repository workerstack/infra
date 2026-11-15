import { dirname } from "node:path";

import { posixRelative } from "../shared/posix-relative.ts";

/** The dir of a package's config file under the product root, posix; `.` for the root itself. */
export function packageDirOf(productRoot: string, file: string): string {
  const dir = posixRelative(productRoot, dirname(file));

  return dir === "" ? "." : dir;
}
