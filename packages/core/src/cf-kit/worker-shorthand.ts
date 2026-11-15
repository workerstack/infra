import type { WorkerConfig } from "@cloudflare/config";

import type { InfraScope } from "../schema/infra.ts";
import type { CfKit } from "./cf-kit.ts";
import type { WorkerOptions } from "./worker-options.ts";

type Base = Omit<CfKit, "worker">;

type Built = { base: string; kit: Base; options: WorkerOptions; scope: InfraScope };

type Env = NonNullable<WorkerConfig["env"]>;

function storageOf({ kit, options, scope }: Built): Env {
  return {
    ...kit.aiSearch(scope, ...(options.aiSearch ?? [])),
    ...kit.analytics(scope, ...(options.analytics ?? [])),
    ...kit.d1(scope, ...(options.d1 ?? [])),
    ...kit.kv(scope, ...(options.kv ?? [])),
    ...kit.r2(scope, ...(options.r2 ?? [])),
  };
}

function bindingsOf(built: Built): Env {
  const { base, kit, options, scope } = built;

  return {
    ...storageOf(built),
    ...kit.queue(scope, ...(options.queue ?? [])),
    ...kit.ratelimits(base, scope, ...(options.ratelimits ?? [])),
    ...kit.secrets(...(options.secrets ?? [])),
    ...kit.services(scope, options.services ?? {}),
    ...(options.vars === undefined ? {} : kit.vars(scope, ...options.vars)),
  };
}

// The routes on their zone, then the triggers `extra` adds; none leaves the key out.
function triggersOf({ base, kit, options }: Built, extra: Partial<WorkerConfig>): Partial<WorkerConfig> {
  const zone = options.zone ?? kit.zoneDomain;

  if (options.routes !== undefined && zone === undefined)
    throw new Error(`${base} has routes but no zone; set cloudflare.zone or pass zone`);

  const routes = options.routes === undefined || zone === undefined ? [] : kit.routes(options.routes, zone);
  const triggers = [...routes, ...(extra.triggers ?? [])];

  return triggers.length > 0 ? { triggers } : {};
}

function dateOf({ compatibilityDate }: WorkerOptions): Partial<WorkerConfig> {
  return compatibilityDate === undefined ? {} : { compatibilityDate };
}

function workerOf(built: Built): WorkerConfig {
  const { base, kit, options, scope } = built;
  const extra = options.extra?.(scope) ?? {};

  // A date comes from the options or the defaults; Cloudflare's schema fails a config with neither.
  return {
    ...kit.defaults,
    ...dateOf(options),
    entrypoint: options.entrypoint,
    name: kit.name(base, scope),
    ...extra,
    env: { ...bindingsOf(built), ...extra.env },
    ...triggersOf(built, extra),
  } /* the date is checked by Cloudflare's schema */ as WorkerConfig;
}

/** A Worker's whole `cloudflare.config.ts` from one call, built per mode from the rest of the kit. */
export function workerShorthand(kit: Base): Pick<CfKit, "worker"> {
  return {
    worker:
      (base, options) =>
      ({ mode }) => ({ worker: workerOf({ base, kit, options, scope: kit.scope(mode) }) }),
  };
}
