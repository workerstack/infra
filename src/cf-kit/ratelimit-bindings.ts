import { bindings, type RateLimitBinding } from "@cloudflare/config";

import type { InfraScope } from "../schema/infra.ts";
import type { CfKit } from "./cf-kit.ts";
import { allocateRatelimitId, readRegistry } from "./ratelimit-ids.ts";

type Limiter = { file: string; name: string; scope: InfraScope; worker: string };

function namespaceId(limiter: Limiter, allocating: () => boolean): string {
  const id = readRegistry(limiter.file)[limiter.worker]?.[limiter.scope]?.[limiter.name];

  if (id !== undefined) return String(id);

  if (allocating()) return String(allocateRatelimitId(limiter));

  throw new Error(`no rate-limit namespace id for ${limiter.worker}/${limiter.scope}/${limiter.name}; run infra gen`);
}

/** Limits by name; the namespace id is the registry's, allocated only while `infra gen` runs. */
export function ratelimitBindings(file: string, allocating: () => boolean): Pick<CfKit, "ratelimits"> {
  return {
    ratelimits: (worker, scope, ...limits) =>
      Object.fromEntries(
        limits.map(({ name, simple }) => [
          name,
          bindings.rateLimit({ namespace: namespaceId({ file, name, scope, worker }, allocating), simple }),
        ]),
      ) /* one entry per limit, keyed by its name */ as Record<(typeof limits)[number]["name"], RateLimitBinding>,
  };
}
