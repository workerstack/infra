import { bindings, triggers, type WorkerBinding } from "@cloudflare/config";

import type { CfKit } from "./cf-kit.ts";

type Links = Pick<CfKit, "name" | "routes" | "services">;

/** How a Worker reaches others and the edge: its name, its routes and its service bindings, the scope suffixed here. */
export function workerLinks(): Links {
  return {
    name: (base, scope) => `${base}-${scope}`,
    routes: (patterns, zone) => patterns.map((pattern) => triggers.fetch({ pattern, zone })),
    services: (scope, targets) =>
      Object.fromEntries(
        Object.entries(targets).map(([binding, worker]) => [
          binding,
          bindings.worker({ worker: `${worker}-${scope}` }),
        ]),
      ) /* one entry per target, keyed by the caller's binding name */ as Record<
        keyof typeof targets & string,
        WorkerBinding
      >,
  };
}
