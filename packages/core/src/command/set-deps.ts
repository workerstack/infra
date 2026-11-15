import { readFile, writeFile } from "node:fs/promises";

import { applyAppleConfig } from "../apple/apply-apple-config.ts";
import { applyGithubConfig } from "../github/apply-github-config.ts";
import { applyGoogleConfig } from "../google/apply-google-config.ts";
import { applyIndexNowConfig } from "../index-now/apply-index-now-config.ts";
import { applyMicrosoftConfig } from "../microsoft/apply-microsoft-config.ts";
import { provisionAccess } from "../provision/provision-access.ts";
import { provisionAiSearchInstances } from "../provision/provision-ai-search-instances.ts";
import { provisionBindings } from "../provision/provision-bindings.ts";
import { zoneRedirects } from "../redirects/zone-redirects.ts";
import { applyZoneConfig } from "../runner/apply-zone-config.ts";
import { writeSecrets } from "../secrets/write-secrets.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import { applyYandexConfig } from "../yandex/apply-yandex-config.ts";
import type { ClientDeps } from "./client-deps.ts";
import { realClient } from "./real-client.ts";

/** The runners, the secret writer and the config file edges `infra set` goes through, swapped by a test. */
export type SetDeps = ClientDeps & {
  applyApple: typeof applyAppleConfig;
  applyGithub: typeof applyGithubConfig;
  applyGoogle: typeof applyGoogleConfig;
  applyIndexNow: typeof applyIndexNowConfig;
  applyMicrosoft: typeof applyMicrosoftConfig;
  applyYandex: typeof applyYandexConfig;
  applyZoneConfig: typeof applyZoneConfig;
  provisionAccess: typeof provisionAccess;
  provisionAiSearch: typeof provisionAiSearchInstances;
  provisionBindings: typeof provisionBindings;
  readConfig: (file: string) => Promise<string>;
  writeConfig: (file: string, text: string) => Promise<void>;
  writeSecrets: typeof writeSecrets;
  zoneRedirects: typeof zoneRedirects;
};

/** The real runners, `bun repo env set` writes, the real config file and the redirects of its Workers. */
export function realSetDeps(): SetDeps {
  return {
    applyApple: applyAppleConfig,
    applyGithub: applyGithubConfig,
    applyGoogle: applyGoogleConfig,
    applyIndexNow: applyIndexNowConfig,
    applyMicrosoft: applyMicrosoftConfig,
    applyYandex: applyYandexConfig,
    applyZoneConfig,
    client: realClient,
    log: stdoutLog,
    provisionAccess,
    provisionAiSearch: provisionAiSearchInstances,
    provisionBindings,
    readConfig: (file) => readFile(file, "utf8"),
    writeConfig: (file, text) => writeFile(file, text),
    writeSecrets,
    zoneRedirects,
  };
}
