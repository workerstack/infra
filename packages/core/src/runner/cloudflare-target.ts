import type { CfFetch } from "../api/cf-fetch.ts";
import type { CloudflareConfig } from "../schema/cloudflare.ts";
import type { InfraEnv } from "../schema/infra.ts";

/**
 * What a Cloudflare get reads: the product's name, its Cloudflare config, the account id and the env, and the
 * `fetch` the AI Search calls use (default global `fetch`).
 */
export type CloudflareTarget = {
  accountId: string;
  config: CloudflareConfig;
  env: InfraEnv;
  fetcher?: CfFetch;
  name: string;
};
