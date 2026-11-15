import type { InfraConfig } from "../schema/infra.ts";
import { CF_KIT } from "./cf-kit.constants.ts";
import type { CfKit } from "./cf-kit.ts";
import { configFacts } from "./config-facts.ts";
import { kitModes } from "./kit-modes.ts";
import { migrationsDir } from "./migrations-dir.ts";
import { queueBindings } from "./queue-bindings.ts";
import { ratelimitAllocation } from "./ratelimit-allocation.ts";
import { ratelimitBindings } from "./ratelimit-bindings.ts";
import { ratelimitRegistry } from "./ratelimit-registry.ts";
import { secretBindings } from "./secret-bindings.ts";
import { secretValues } from "./secret-values.ts";
import { storageBindings } from "./storage-bindings.ts";
import { varBindings } from "./var-bindings.ts";
import { workerLinks } from "./worker-links.ts";
import { workerShorthand } from "./worker-shorthand.ts";

/**
 * The kit of a parsed config, from its `cloudflare.workers`: the one place every Worker's `cloudflare.config.ts` gets
 * bindings, vars and secrets, so a value comes from the same env for every Worker. It takes any name and checks it
 * at run time; `defineInfraConfig` narrows the names to the config's.
 */
export function buildKit(config: InfraConfig): CfKit {
  const workers = config.cloudflare?.workers ?? {};
  const context = { config, localRemote: new Set(workers.localRemote) };
  const allocation = ratelimitAllocation();
  const registry = ratelimitRegistry(workers.ratelimitIds);

  const kit: Omit<CfKit, "worker"> = {
    [CF_KIT]: true,
    ...allocation.toggle,
    ...registry,
    ...storageBindings(context),
    ...queueBindings(context),
    ...ratelimitBindings(() => registry.ratelimitFile(), allocation.allocating),
    ...workerLinks(),
    ...configFacts(context),
    ...kitModes(),
    ...migrationsDir(workers.migrations),
    ...secretBindings(context),
    ...secretValues(context),
    ...varBindings(context),
    defaults: workers.defaults ?? {},
  };

  return { ...kit, ...workerShorthand(kit) };
}
