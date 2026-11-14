import type { Product } from "../products.ts";
import type { SecretWrite } from "../provision/secret-write.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import { secretsWriter } from "./secrets-writer.ts";
import { spawnEnvSet } from "./spawn-env-set.ts";

/** Writes each secret into the product's env file with `bun repo env set`, in order; the value goes on stdin only. */
export function writeSecrets(root: string, product: Product, secrets: SecretWrite[]): Promise<void> {
  return secretsWriter({ log: stdoutLog, spawn: spawnEnvSet })(root, product, secrets);
}
