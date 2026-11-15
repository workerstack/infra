import type { CfKit } from "../cf-kit/cf-kit.ts";
import type { ChildEnv } from "../child-env.ts";
import type { Product } from "../products.ts";
import { buildWipePlan, type WipePlan } from "./build-wipe-plan.ts";
import type { DbIo } from "./db-io.ts";
import type { DbScope } from "./db-scope.ts";
import { firstText } from "./first-text.ts";
import { ownerConfig } from "./owner-config.ts";
import { parseTableRows } from "./parse-table-rows.ts";
import { readSchemaTableNames } from "./read-schema-table-names.ts";
import { runSqlFile } from "./run-sql-file.ts";
import { LIST_TABLES_SQL } from "./sql-tables.constants.ts";
import type { WipeResult } from "./wipe-result.ts";
import { wranglerD1Args } from "./wrangler-d1-args.ts";

/** What one D1 binding wipes through: its name and database name in the scope, the kit, and the run's edges. */
export type WipeInput = {
  binding: string;
  databaseName: string | undefined;
  dryRun: boolean;
  env: ChildEnv;
  io: DbIo;
  kit: CfKit;
  product: Product;
  scope: DbScope;
};

type Target = { configPath: string; databaseName: string; dir: string };

function targetOf(input: WipeInput): Target {
  const migrations = input.kit.migrations(input.binding);

  if (migrations === undefined) throw new Error("no migrations in the kit for the binding");

  if (input.databaseName === undefined || input.databaseName === "") throw new Error("binding has no database_name");

  const query = { binding: input.binding, dir: migrations.dir, scope: input.scope };

  return { configPath: ownerConfig(input.product, query), databaseName: input.databaseName, dir: migrations.dir };
}

async function planOf(input: WipeInput, target: Target): Promise<WipePlan> {
  const { configPath, databaseName } = target;
  const args = wranglerD1Args({ configPath, databaseName, sql: { command: LIST_TABLES_SQL } });
  const list = await input.io.spawn("wrangler", args, { cwd: input.product.root, env: input.env });

  if (list.code !== 0) throw new Error(firstText([list.stderr, list.stdout], "list tables failed"));

  return buildWipePlan(parseTableRows(list.stdout), readSchemaTableNames(target.dir));
}

async function execute(input: WipeInput, target: Target, sql: string): Promise<void> {
  const { configPath, databaseName } = target;
  const { binding, env, io, product } = input;
  const exec = await runSqlFile(io, { binding, configPath, cwd: product.root, databaseName, env, sql });

  if (exec.code !== 0) throw new Error(firstText([exec.stderr, exec.stdout], "wipe execute failed"));
}

function resultOf(input: WipeInput, started: number): (status: WipeResult["status"], plan?: WipePlan) => WipeResult {
  return (status, plan) => ({
    binding: input.binding,
    databaseName: input.databaseName ?? "",
    deleted: plan?.deleted.length ?? 0,
    dropped: plan?.dropped.length ?? 0,
    durationMs: Math.round(performance.now() - started),
    status,
  });
}

/**
 * Wipes one binding's database: lists its live tables, plans from them and the kit's migrations dir, and runs the
 * SQL (nothing with `dryRun`). Any failure is the binding's result, so the rest still run.
 */
export async function wipeBinding(input: WipeInput): Promise<WipeResult> {
  const result = resultOf(input, performance.now());

  try {
    const target = targetOf(input);
    const plan = await planOf(input, target);

    if (input.dryRun) return result("dry-run", plan);

    if (plan.deleted.length + plan.dropped.length === 0) return result("noop");

    await execute(input, target, plan.sql);

    return result("wiped", plan);
  } catch (error) {
    return { ...result("failed"), note: error instanceof Error ? error.message : String(error) };
  }
}
