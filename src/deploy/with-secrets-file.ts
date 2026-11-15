import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { SECRETS_DIR_PREFIX, SECRETS_FILE_MODE, SECRETS_FILE_NAME } from "./secrets-file.constants.ts";

/**
 * Runs `use` with the path of a 0600 JSON file holding `secrets`, which is gone when `use` ends, however it ends.
 * A Worker with no secrets gets no file.
 */
export async function withSecretsFile<T>(
  secrets: Record<string, string>,
  use: (file: string | undefined) => Promise<T>,
): Promise<T> {
  if (Object.keys(secrets).length === 0) return use(undefined);

  const dir = mkdtempSync(join(tmpdir(), SECRETS_DIR_PREFIX));

  try {
    const file = join(dir, SECRETS_FILE_NAME);

    writeFileSync(file, JSON.stringify(secrets), { mode: SECRETS_FILE_MODE });

    return await use(file);
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
}
