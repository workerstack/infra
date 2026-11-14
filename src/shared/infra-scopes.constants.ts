import type { InfraScope } from "../schema/infra.ts";

/** Every scope, in the order a command visits them. */
export const INFRA_SCOPES: readonly InfraScope[] = ["local", "dev", "prod"];
