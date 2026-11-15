import { dirname, join } from "node:path";

import { MIGRATE_CONFIG_FILE } from "../db/migrate-config-file.constants.ts";
import type { InfraScope } from "../schema/infra.ts";
import { LOCAL_SCOPE } from "../shared/local-scope.constants.ts";
import { posixRelative } from "../shared/posix-relative.ts";
import { GENERATED_DIR, MIGRATE_CONFIG_HEADER } from "./cf-config.constants.ts";
import type { JsonObject } from "./json-object.ts";
import { objectsAt } from "./objects-at.ts";
import type { PackageInput } from "./package-input.ts";
import type { PlannedFile } from "./planned-file.ts";
import { renderTsValue } from "./render-ts-value.ts";
import { stringAt } from "./string-at.ts";

const PREAMBLE = [
  MIGRATE_CONFIG_HEADER,
  "// What `defineConfig` of `@workerstack/database/migrate` takes, from the D1 migrations in infra.config.ts:",
  "// wrangler finds each database by its binding in the config of the Worker that owns them, per deploy scope.",
];

type Owned = { binding: string; database: string; dir: string };

type Database = { environments: Record<string, Environment>; migrationsDir: string };

type Environment = { name: string; provider: { databaseName: string; type: string; wranglerConfig: string } };

// The D1 bindings whose migrations this package owns, by the `migrations_dir` gen gave them, that name a database.
function ownedOf(input: PackageInput, wrangler: JsonObject): Owned[] {
  return (objectsAt(wrangler, "d1_databases") ?? []).flatMap((db) => {
    const binding = stringAt(db, "binding") ?? "";
    const owned = stringAt(db, "migrations_dir") === undefined ? undefined : input.kit.migrations(binding);

    return owned?.database === undefined ? [] : [{ binding, database: owned.database, dir: owned.dir }];
  });
}

function posix(from: string, to: string): string {
  const path = posixRelative(from, to);

  return path.startsWith(".") ? path : `./${path}`;
}

function environmentOf(input: PackageInput, owned: Owned, name: InfraScope): Environment {
  const wrangler = join(input.dir, GENERATED_DIR, `wrangler.${name}.json`);

  return {
    name,
    provider: { databaseName: owned.binding, type: "d1", wranglerConfig: posix(dirname(owned.dir), wrangler) },
  };
}

function databaseOf(input: PackageInput, owned: Owned): Database {
  const scopes = input.kit.envs.filter((scope) => scope !== LOCAL_SCOPE);

  return {
    environments: Object.fromEntries(scopes.map((name) => [name, environmentOf(input, owned, name)])),
    migrationsDir: posix(dirname(owned.dir), owned.dir),
  };
}

/**
 * The `database.migrate.config.ts` beside each migrations dir this package owns, for the bindings whose migrations
 * name a `database`: one per dir, every database owned there in it.
 */
export function planMigrateConfigs(input: PackageInput, wrangler: JsonObject): PlannedFile[] {
  const byFile = new Map<string, Record<string, Database>>();

  for (const owned of ownedOf(input, wrangler)) {
    const file = join(dirname(owned.dir), MIGRATE_CONFIG_FILE);

    byFile.set(file, { ...byFile.get(file), [owned.database]: databaseOf(input, owned) });
  }

  return [...byFile].map(([file, databases]) => ({
    file,
    header: MIGRATE_CONFIG_HEADER,
    text: `${PREAMBLE.join("\n")}\nexport default ${renderTsValue({ databases })};\n`,
  }));
}
