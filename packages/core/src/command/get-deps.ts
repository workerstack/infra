import { verifyAppleConfig } from "../apple/verify-apple-config.ts";
import { verifyGithubConfig } from "../github/verify-github-config.ts";
import { verifyGoogleConfig } from "../google/verify-google-config.ts";
import { verifyIndexNowConfig } from "../index-now/verify-index-now-config.ts";
import { verifyMicrosoftConfig } from "../microsoft/verify-microsoft-config.ts";
import { getCloudflare } from "../runner/get-cloudflare.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import { verifyYandexConfig } from "../yandex/verify-yandex-config.ts";
import type { ClientDeps } from "./client-deps.ts";
import { realClient } from "./real-client.ts";

/** The runners `infra get` calls, swapped by a test. */
export type GetDeps = ClientDeps & {
  getCloudflare: typeof getCloudflare;
  verifyApple: typeof verifyAppleConfig;
  verifyGithub: typeof verifyGithubConfig;
  verifyGoogle: typeof verifyGoogleConfig;
  verifyIndexNow: typeof verifyIndexNowConfig;
  verifyMicrosoft: typeof verifyMicrosoftConfig;
  verifyYandex: typeof verifyYandexConfig;
};

/** The real runners over the real client and stdout. */
export function realGetDeps(): GetDeps {
  return {
    client: realClient,
    getCloudflare,
    log: stdoutLog,
    verifyApple: verifyAppleConfig,
    verifyGithub: verifyGithubConfig,
    verifyGoogle: verifyGoogleConfig,
    verifyIndexNow: verifyIndexNowConfig,
    verifyMicrosoft: verifyMicrosoftConfig,
    verifyYandex: verifyYandexConfig,
  };
}
