import type { CfFetch } from "../api/cf-fetch.ts";
import type { InfraEnv } from "../schema/infra.ts";
import type { YandexConfig } from "../schema/yandex.ts";
import type { Log } from "../shared/log.ts";

/** What a Yandex runner needs: the config, the env, the resolved host URL, and the edges a test swaps. */
export type YandexTarget = {
  apiBase?: string;
  config: YandexConfig;
  env: InfraEnv;
  fetcher?: CfFetch;
  hostUrl: string;
  log?: Log;
};
