import type { D1Migration } from "../schema/workers.ts";
import type { CfKit } from "./cf-kit.ts";

type Migrations = Readonly<Record<string, D1Migration>>;

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
