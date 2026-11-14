import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { discoverProducts } from "../../products.ts";
import type { Product } from "../../products.ts";
import type { EnvSetCall } from "../env-set-call.ts";
import type { SecretsDeps } from "../secrets-deps.ts";

const roots: string[] = [];

/** A temp repo with one product `apps/web`, and what a fake spawn and log recorded. */
export type EnvRepo = { calls: EnvSetCall[]; deps: SecretsDeps; lines: string[]; product: Product; root: string };

/** The text of an env file that calls `defineEnv(` (in a comment) and exports a plain env object. */
export const DEFINING_ENV = "// defineEnv(\nexport const env = { dev: {}, global: {}, local: {}, prod: {} };\n";

/** The text of an env file that never calls `defineEnv(`. */
export const PLAIN_ENV = "export const env = { dev: {}, global: {}, local: {}, prod: {} };\n";

/** Builds the repo with `envText` as `apps/web/env.ts`; the fake spawn exits with `code`. */
export async function envRepo(envText: string, code: number): Promise<EnvRepo> {
  const root = mkdtempSync(join(tmpdir(), "secrets-"));
  const web = join(root, "apps", "web");
  const peer = join(root, "node_modules", "@workerstack", "repo");

  roots.push(root);
  mkdirSync(join(root, ".git"));
  mkdirSync(peer, { recursive: true });
  mkdirSync(web, { recursive: true });
  writeFileSync(join(root, "package.json"), "{}");
  writeFileSync(join(peer, "package.json"), JSON.stringify({ bin: { repo: "./bin/repo.ts" } }));
  writeFileSync(join(web, "infra.config.ts"), 'import { env } from "./env.ts";\nexport default { env };\n');
  writeFileSync(join(web, "env.ts"), envText);
  const [product] = await discoverProducts(root);

  if (product === undefined) throw new Error("no product");
  const calls: EnvSetCall[] = [];
  const lines: string[] = [];

  const deps: SecretsDeps = {
    log: (line) => lines.push(line),
    spawn: (call) => {
      calls.push(call);

      return Promise.resolve(code);
    },
  };

  return { calls, deps, lines, product, root };
}

/** Removes every repo `envRepo` made. */
export function removeEnvRepos(): void {
  for (const root of roots.splice(0)) rmSync(root, { force: true, recursive: true });
}
