import { relative, sep } from "node:path";

import { peerBin } from "../peer-bin.ts";
import type { Product } from "../products.ts";
import type { SecretWrite } from "../provision/secret-write.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import { findEnvFile } from "./find-env-file.ts";
import type { SecretsDeps } from "./secrets-deps.ts";

/** A `writeSecrets` over `deps`: writes each secret with `bun repo env set`, in order; the value goes on stdin only. */
export function secretsWriter(deps: SecretsDeps) {
  return async (root: string, product: Product, secrets: SecretWrite[]): Promise<void> => {
    if (secrets.length === 0) return;

    const file = await findEnvFile(product);

    if (file === undefined) {
      throw new Error(
        `no env file under ${product.name} exports the config's env; define it with defineEnv beside infra.config.ts`,
      );
    }

    const bin = peerBin(root, "@workerstack/repo", "repo");
    const shown = relative(root, file).split(sep).join("/");

    await runInOrder(secrets, async ({ key, scope, value }) => {
      const args = [bin, "env", "set", key, "--scope", scope, "--file", shown];
      const code = await deps.spawn({ args, command: process.execPath, cwd: root, stdin: value });

      if (code !== 0) throw new Error(`bun repo env set ${key} (${scope}) exited ${code}`);
      deps.log(`wrote ${key} (${scope}) with bun repo env set`);
    });
  };
}
