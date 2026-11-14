import type { CfFetch } from "../api/cf-fetch.ts";
import type { GoogleConfig } from "../schema/google.ts";
import type { InfraEnv } from "../schema/infra.ts";
import type { Log } from "../shared/log.ts";

/** What a Google runner needs: the config, the product env, and the edges a test swaps. */
export type GoogleTarget = { config: GoogleConfig; env: InfraEnv; fetcher?: CfFetch; log?: Log };
