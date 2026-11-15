import type { CfAccountClient } from "../api/account-client.ts";
import type { InfraEnv } from "../schema/infra.ts";

/** What `infra logs-query` reaches outside itself through: an account client for a product env, and the clock. */
export type QueryDeps = { client: (env: InfraEnv) => CfAccountClient; now: () => number };
