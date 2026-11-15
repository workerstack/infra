import type { CfKit } from "../cf-kit/cf-kit.ts";
import type { ChildEnv } from "../child-env.ts";
import type { Product } from "../products.ts";
import type { DbIo } from "./db-io.ts";
import type { DbScope } from "./db-scope.ts";
import type { MigrationResult } from "./migration-result.ts";
import { migrationsCwd } from "./migrations-cwd.ts";
import { parseApplyOutput } from "./parse-apply-output.ts";

/** What one D1 binding migrates through: its name and database name in the scope, the kit, and the run's edges. */
export type MigrateInput = {
  binding: string;
  databaseName: string | undefined;
  env: ChildEnv;
  io: DbIo;
  kit: CfKit;
  product: Product;
  scope: DbScope;
};

function idle(input: MigrateInput, status: "failed" | "skipped", note: string): MigrationResult {
  return {
    binding: input.binding,
    databaseName: input.databaseName ?? "",
    durationMs: 0,
    migrationsApplied: 0,
    note,
    status,
  };
}

/**
 * `database migrate apply <database> -e <scope> --yes --json` for the binding, in the package holding its migrate
 * config. A binding the kit gives no `database` is skipped; one with no `database_name` fails.
 */
export async function migrateBinding(input: MigrateInput): Promise<MigrationResult> {
  const migrations = input.kit.migrations(input.binding);

  if (migrations?.database === undefined) return idle(input, "skipped", "no database in the kit's migrations");

  if (input.databaseName === undefined || input.databaseName === "")
    return idle(input, "failed", "binding has no database_name");

  const cwd = migrationsCwd(input.product, migrations.dir);
  const started = performance.now();
  const args = ["migrate", "apply", migrations.database, "-e", input.scope, "--yes", "--json"];
  const ran = await input.io.spawn("database", args, { cwd, env: input.env });
  const parsed = parseApplyOutput(ran.stdout, ran.stderr, ran.code);
  const { error, ...rest } = parsed;

  return {
    ...rest,
    binding: input.binding,
    databaseName: input.databaseName,
    durationMs: Math.round(performance.now() - started),
    ...(error === undefined ? {} : { note: error }),
  };
}
