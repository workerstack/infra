import { dirname, relative } from "node:path";

/** The dir of a package's config file under the product root, posix; `.` for the root itself. */
export function packageDirOf(productRoot: string, file: string): string {
  const dir = relative(productRoot, dirname(file));

  return dir === "" ? "." : dir;
}
