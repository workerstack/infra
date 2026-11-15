import { join } from "node:path";

import { runInOrder } from "../shared/run-in-order.ts";
import { CF_CONFIG_FILE } from "./cf-config.constants.ts";
import type { PackageInput } from "./package-input.ts";
import { planMigrateConfigs } from "./plan-migrate-configs.ts";
import type { PlannedFile } from "./planned-file.ts";
import { readBundlerSettings } from "./read-bundler-settings.ts";
import { readCfConfig } from "./read-cf-config.ts";
import { scopeFiles } from "./scope-files.ts";
import { wranglerFor } from "./wrangler-for.ts";

/**
 * Every file a Worker package gets, scope by scope in the kit's order, then the migrate config of each migrations
 * dir it owns. Reads the configs; writes nothing.
 */
export async function planCfPackage(input: PackageInput): Promise<PlannedFile[]> {
  const { dir, kit } = input;
  const planned: PlannedFile[] = [];
  const migrate = new Map<string, PlannedFile>();

  await runInOrder([...kit.envs], async (scope) => {
    const { wrangler } = await readCfConfig(join(dir, CF_CONFIG_FILE), scope);
    const settings = await readBundlerSettings(dir, scope);
    const converted = wranglerFor({ dir, kit, scope, settings, wrangler });

    planned.push(...scopeFiles(input, scope, converted));

    for (const file of planMigrateConfigs(input, converted)) migrate.set(file.file, file);
  });

  return [...planned, ...migrate.values()];
}
