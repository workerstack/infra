import type { ParsedWorker } from "../cf-config/cf-config.ts";
import { discoverCfConfigs } from "../cf-config/discover-cf-configs.ts";
import { readCfConfig } from "../cf-config/read-cf-config.ts";
import type { LocaleWorker } from "./locale-worker.ts";
import { packageDirOf } from "./package-dir-of.ts";

// A Worker as the locale rules read it: the name it deploys as in prod and the patterns of its fetch triggers.
function localeWorkerOf(dir: string, worker: ParsedWorker): LocaleWorker {
  const routes = (worker.triggers ?? []).flatMap((trigger) =>
    trigger.type === "fetch" ? [{ pattern: trigger.pattern }] : [],
  );

  return { dir, name: worker.name, routes };
}

/** Every `cloudflare.config.ts` of a product as the locale rules read it, read for prod, by its dir under the root. */
export function cfLocaleWorkers(productRoot: string): Promise<LocaleWorker[]> {
  return Promise.all(
    discoverCfConfigs(productRoot).map(async (file) => {
      const { worker } = await readCfConfig(file, "prod");

      return localeWorkerOf(packageDirOf(productRoot, file), worker);
    }),
  );
}
