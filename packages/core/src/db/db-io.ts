import type { ChildEnv } from "../child-env.ts";
import type { ChildOptions } from "../deploy/child-options.ts";
import type { Product } from "../products.ts";
import type { Log } from "../shared/log.ts";

/** The programs a database command runs, both peer packages. */
export type DbTool = "database" | "wrangler";

/** What a finished program left: its exit code and both streams. */
export type DbRun = { code: number; stderr: string; stdout: string };

/** The edges a database command runs through, swapped by a test: the product's env, programs and output. */
export type DbIo = {
  /** The product's child env; fails with the fix line for a missing credential. */
  env: (product: Product) => ChildEnv;
  print: Log;
  /** A program run to its end with stdin closed and both output streams read. */
  spawn: (tool: DbTool, args: string[], child: ChildOptions) => Promise<DbRun>;
};
