import type { CfFetch } from "../api/cf-fetch.ts";
import type { InfraEnv } from "../schema/infra.ts";
import type { MicrosoftConfig } from "../schema/microsoft.ts";
import type { Log } from "../shared/log.ts";

/** What a Microsoft runner needs: the config, the product env, and the edges a test swaps. */
export type MicrosoftTarget = { config: MicrosoftConfig; env: InfraEnv; fetcher?: CfFetch; log?: Log };
