import { spawn } from "node:child_process";
import { resolve } from "node:path";

import { assertNotUnderTest } from "./assert-not-under-test.ts";
import type { ChildEnv } from "./child-env.ts";
import { env as processEnv } from "./env.ts";
import { FAILURE_EXIT } from "./failure-exit.constants.ts";
import { discoverProducts, productAt } from "./products.ts";
import { repoRoot } from "./repo-root.ts";
import type { InfraEnv } from "./schema/infra.ts";

export type ProductRun = {
  /** The command's name, shown in front of an error. */
  name: string;
  /** The dir whose product supplies the env; resolved against the current dir. */
  dir: string;
  /** Builds the child's env from the product's env; throws the fix line for a missing key. */
  childEnv: (env: InfraEnv) => ChildEnv;
  /** The program to spawn, given the repo root; runs after the env is built. */
  program: (root: string) => { args: string[]; file: string };
  /** The child's working dir. */
  cwd: string;
};

/**
 * Runs the guard, finds the product holding `dir`, and runs the program with that product's env.
 * Resolves to the child's exit code.
 */
export async function runInProduct(run: ProductRun): Promise<number> {
  try {
    assertNotUnderTest(processEnv);

    const root = repoRoot(process.cwd());
    const selection = productAt(root, await discoverProducts(root), resolve(run.dir));

    if (!selection.ok) throw new Error(selection.error);

    const [product] = selection.products;
    const env = run.childEnv(product?.config.env ?? { dev: {}, global: {}, local: {}, prod: {} });
    const { args, file } = run.program(root);

    return await exitCode({ args, cwd: resolve(run.cwd), env, file });
  } catch (error) {
    process.stderr.write(`infra ${run.name}: ${error instanceof Error ? error.message : String(error)}\n`);

    return FAILURE_EXIT;
  }
}

type Spawned = { args: string[]; cwd: string; env: ChildEnv; file: string };

function exitCode({ args, cwd, env, file }: Spawned): Promise<number> {
  return new Promise((done, fail) => {
    const child = spawn(file, args, { cwd, env, stdio: "inherit" });

    child.on("error", fail);
    child.on("close", (code) => {
      done(code ?? FAILURE_EXIT);
    });
  });
}
