import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

import { discoverCfConfigs } from "../cf-config/discover-cf-configs.ts";
import { cfLocaleWorkers } from "./cf-locale-workers.ts";
import { LOCALE_RECORD } from "./locale-record.constants.ts";
import { localeRules } from "./locale-rules.ts";
import { packageDirOf } from "./package-dir-of.ts";

type LocaleCheck = { listed: readonly string[]; productRoot: string };

/**
 * A product's locale rules agree with its zone config: every package with a locale record is listed in
 * `redirects.locale`, and the listed apps' rules build.
 */
export async function checkLocaleRedirects({ listed, productRoot }: LocaleCheck): Promise<void> {
  for (const file of discoverCfConfigs(productRoot)) {
    const dir = packageDirOf(productRoot, file);

    if (!listed.includes(dir) && existsSync(join(dirname(file), LOCALE_RECORD))) {
      throw new Error(
        `${dir}/${LOCALE_RECORD}: the app sends visitors to their locale at the edge, ` +
          `but its zone config doesn't list it; add "${dir}" to cloudflare.zone.redirects.locale`,
      );
    }
  }

  if (listed.length === 0) return;

  localeRules({ dirs: listed, productRoot, workers: await cfLocaleWorkers(productRoot) });
}
