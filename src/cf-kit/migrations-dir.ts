import type { CfKit } from "./cf-kit.ts";

/** The D1 migrations each binding owns: an absolute directory, and the base name of the Worker that owns them. */
export type Migrations = Readonly<Record<string, { dir: string; owner: string }>>;

/** The directory a binding's migrations live in, for the one Worker that owns them. */
export function migrationsDir(migrations: Migrations = {}): Pick<CfKit, "migrationsDir"> {
  return {
    migrationsDir(scope, worker, binding) {
      const owned = migrations[binding];

      return owned !== undefined && worker === `${owned.owner}-${scope}` ? owned.dir : undefined;
    },
  };
}
