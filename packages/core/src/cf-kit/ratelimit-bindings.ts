import { bindings, type RateLimitBinding } from "@cloudflare/config";

import type { InfraScope } from "../schema/infra.ts";
import type { CfKit } from "./cf-kit.ts";
import { allocateRatelimitId, readRegistry } from "./ratelimit-ids.ts";

type Limiter = { name: string; scope: InfraScope; worker: string };

type Registry = { allocating: () => boolean; file: () => string };

function namespaceId(limiter: Limiter, registry: Registry): string {
  const file = registry.file();
  const id = readRegistry(file)[limiter.worker]?.[limiter.scope]?.[limiter.name];

  if (id !== undefined) return String(id);

  if (registry.allocating()) return String(allocateRatelimitId({ ...limiter, file }));

  throw new Error(`no rate-limit namespace id for ${limiter.worker}/${limiter.scope}/${limiter.name}; run infra gen`);
}

/**
 * Limits by name; the namespace id is the registry's, allocated only while `infra gen` runs. The registry file is
 * asked for when a limiter is built, so the kit may learn its product root after the config loads.
 */
export function ratelimitBindings(file: () => string, allocating: () => boolean): Pick<CfKit, "ratelimits"> {
  const registry = { allocating, file };

  return {
    ratelimits: (worker, scope, ...limits) =>
      Object.fromEntries(
        limits.map(({ name, simple }) => [
          name,
          bindings.rateLimit({ namespace: namespaceId({ name, scope, worker }, registry), simple }),
        ]),
      ) /* one entry per limit, keyed by its name */ as Record<(typeof limits)[number]["name"], RateLimitBinding>,
  };
}
