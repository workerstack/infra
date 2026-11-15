import type { CfFetch } from "../api/cf-fetch.ts";
import type { GithubConfig } from "../schema/github.ts";
import type { InfraEnv } from "../schema/infra.ts";
import type { Log } from "../shared/log.ts";

/** What a GitHub runner needs: the config, the product env, and the edges a test swaps. */
export type GithubTarget = {
  apiBase?: string;
  canPrompt?: boolean;
  config: GithubConfig;
  env: InfraEnv;
  fetcher?: CfFetch;
  log?: Log;
  openUrl?: (url: string) => void;
  timeoutMs?: number;
  webBase?: string;
};
