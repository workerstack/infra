import type { CfFetch } from "../api/cf-fetch.ts";
import type { AppleConfig } from "../schema/apple.ts";
import type { InfraEnv } from "../schema/infra.ts";
import type { Log } from "../shared/log.ts";

/** What an Apple runner needs: the config, the product env, and the edges a test swaps. */
export type AppleTarget = { config: AppleConfig; env: InfraEnv; fetcher?: CfFetch; log?: Log };
