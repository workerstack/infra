import type { CfKit } from "./cf-kit.ts";

/**
 * The D1 migrations each binding owns: an absolute directory, the base name of the Worker that owns them, and the
 * database name its `database.migrate.config.ts` uses.
 */
export type Migrations = Readonly<Record<string, { database?: string; dir: string; owner: string }>>;

/** The directory a binding's migrations live in, for the one Worker that owns them; and the entry of a binding. */
export function migrationsDir(migrations: Migrations = {}): Pick<CfKit, "migrations" | "migrationsDir"> {
  return {
    migrations: (binding) => (Object.hasOwn(migrations, binding) ? migrations[binding] : undefined),
    migrationsDir(scope, worker, binding) {
      const owned = migrations[binding];

      return owned !== undefined && worker === `${owned.owner}-${scope}` ? owned.dir : undefined;
    },
  };
}
