import { verifyAppleConfig } from "../apple/verify-apple-config.ts";
import { verifyGithubConfig } from "../github/verify-github-config.ts";
import { verifyGoogleConfig } from "../google/verify-google-config.ts";
import { verifyMicrosoftConfig } from "../microsoft/verify-microsoft-config.ts";
import { getCloudflare } from "../runner/get-cloudflare.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import type { ClientDeps } from "./client-deps.ts";
import { realClient } from "./real-client.ts";

/** The runners `infra get` calls, swapped by a test. */
export type GetDeps = ClientDeps & {
  getCloudflare: typeof getCloudflare;
  verifyApple: typeof verifyAppleConfig;
  verifyGithub: typeof verifyGithubConfig;
  verifyGoogle: typeof verifyGoogleConfig;
  verifyMicrosoft: typeof verifyMicrosoftConfig;
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
    verifyMicrosoft: verifyMicrosoftConfig,
  };
}
