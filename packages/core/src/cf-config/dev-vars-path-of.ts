import { join } from "node:path";

/**
 * The file of a scope's values beside a Worker package (`.dev.vars.local`), which wrangler and `vite preview` read
 * for that scope. Every run names its scope, so no bare `.dev.vars` is written here.
 */
export function devVarsPathOf(dir: string, scope: string): string {
  return join(dir, `.dev.vars.${scope}`);
}
