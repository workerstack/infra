import path from "node:path";

/**
 * `to` relative to `from` with `/` between its parts on every platform, as a message prints it or a posix name holds
 * it. `paths` is the platform's path module; a test hands in `path.win32`. Never hand the result to fs or spawn.
 */
export function posixRelative(from: string, to: string, paths: typeof path = path): string {
  return paths.relative(from, to).split(paths.sep).join("/");
}
