import { existsSync } from "node:fs";
import { join } from "node:path";

import type { InfraScope } from "../schema/infra.ts";
import type { BundlerSettings } from "./bundler-settings.ts";
import { CF_CONFIG_FILE, WRANGLER_CONFIG_FILE } from "./cf-config.constants.ts";
import { readBundlerSettings } from "./read-bundler-settings.ts";

/**
 * The build settings of a Worker package for `scope`: those `infra.worker` carried, else its `wrangler.config.ts`.
 * A package with both fails naming both files, so a setting never comes from two places.
 */
export function settingsOf(dir: string, scope: InfraScope, carried: BundlerSettings): Promise<BundlerSettings> {
  if (Object.keys(carried).length === 0) return readBundlerSettings(dir, scope);

  const wrangler = join(dir, WRANGLER_CONFIG_FILE);

  if (!existsSync(wrangler)) return Promise.resolve(carried);

  return Promise.reject(
    new Error(
      `${join(dir, CF_CONFIG_FILE)} sets ${Object.keys(carried).join(", ")} in infra.worker and ${wrangler} ` +
        "also exists: keep the settings in one of them",
    ),
  );
}
