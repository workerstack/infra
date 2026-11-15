import type { WorkerConfig } from "@cloudflare/config";

import type { InfraConfig } from "../schema/infra.ts";
import type { KeysOf, LocalRemoteKind } from "./cf-kit-types.ts";
import { CF_KIT } from "./cf-kit.constants.ts";
import type { CfKit } from "./cf-kit.ts";
import { configFacts } from "./config-facts.ts";
import { kitModes } from "./kit-modes.ts";
import { type Migrations, migrationsDir } from "./migrations-dir.ts";
import { queueBindings } from "./queue-bindings.ts";
import { ratelimitAllocation } from "./ratelimit-allocation.ts";
import { ratelimitBindings } from "./ratelimit-bindings.ts";
import { secretBindings } from "./secret-bindings.ts";
import { secretValues } from "./secret-values.ts";
import { storageBindings } from "./storage-bindings.ts";
import { varBindings } from "./var-bindings.ts";
import { workerLinks } from "./worker-links.ts";

type KitInput<I extends InfraConfig, D extends Partial<WorkerConfig>> = {
  /** The product's infra config, whose env holds the values. */
  config: I;
  /** What every Worker of the product shares. */
  defaults?: D;
  /** The kinds whose bindings read their remote resource in local. */
  localRemote?: readonly LocalRemoteKind[];
  /** The D1 migrations each binding owns, and the database name `infra db-migrate` applies them as. */
  migrations?: { readonly [B in KeysOf<I>["d1"]]?: { database?: string; dir: string; owner: string } };
  /** The registry file the limiters' namespace ids live in. */
  ratelimitIds: string;
};

/**
 * A product's kit from its infra config: the one place every Worker's `cloudflare.config.ts` gets bindings, vars and
 * secrets, so a wrong name is a compile error and a value comes from the same env for every Worker. The signature
 * narrows the names to the product's; the body takes any name and checks it at run time.
 */
export function createCfKit<const I extends InfraConfig, const D extends Partial<WorkerConfig> = Partial<WorkerConfig>>(
  input: KitInput<I, D>,
): CfKit<KeysOf<I>, D>;
export function createCfKit(input: {
  config: InfraConfig;
  defaults?: Partial<WorkerConfig>;
  localRemote?: readonly LocalRemoteKind[];
  migrations?: Migrations;
  ratelimitIds: string;
}): CfKit {
  const context = {
    config: input.config,
    localRemote: new Set(input.localRemote),
    ratelimitIds: input.ratelimitIds,
  };

  const allocation = ratelimitAllocation();

  return {
    [CF_KIT]: true,
    ...allocation.toggle,
    ...storageBindings(context),
    ...queueBindings(context),
    ...ratelimitBindings(input.ratelimitIds, allocation.allocating),
    ...workerLinks(),
    ...configFacts(context),
    ...kitModes(),
    ...migrationsDir(input.migrations),
    ...secretBindings(context),
    ...secretValues(context),
    ...varBindings(context),
    defaults: input.defaults ?? {},
    ratelimitIds: input.ratelimitIds,
  };
}
