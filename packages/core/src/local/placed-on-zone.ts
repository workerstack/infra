import type { EdgeRoute } from "./edge-route.ts";
import type { LocalRoute } from "./local-route.ts";
import { localRoutes } from "./local-routes.ts";
import { PATTERN_PATH, SUBDOMAIN_PREFIX } from "./local.constants.ts";

/** Where a package's prod routes go: its config file, the product's local host and zone, and the Worker's name. */
type Placement = { localHost: string; source: string; worker: string; zone: string | undefined };

function patternOf(route: EdgeRoute): string {
  return route instanceof Object ? route.pattern : route;
}

// A custom domain is a whole host, so every path on it reaches the Worker.
function edgePatternOf(route: EdgeRoute): string {
  const pattern = patternOf(route);

  return route instanceof Object && route.custom_domain === true && !pattern.includes("/") ? `${pattern}/*` : pattern;
}

/**
 * A package's prod routes on the product's local host. Every route sits on the kit's zone: a custom domain names no
 * zone, so the kit's `zoneDomain` is the one place the stack learns it. A route off the zone fails naming the file.
 */
export function placedOnZone(routes: readonly EdgeRoute[], where: Placement): LocalRoute[] {
  const { zone } = where;

  if (routes.length === 0) return [];

  if (zone === undefined) {
    const why = "the kit's infra has no cloudflare zone, so the local edge can't place its prod routes";

    throw new Error(`${where.source}: ${why}`);
  }

  const off = routes
    .map((route) => patternOf(route))
    .find((pattern) => {
      const host = pattern.replace(PATTERN_PATH, "").replace(SUBDOMAIN_PREFIX, "");

      return host !== zone && !host.endsWith(`.${zone}`);
    });

  if (off !== undefined)
    throw new Error(`${where.source}: prod route ${JSON.stringify(off)} is not on the kit's zone ${zone}`);

  const placed = routes.map((route) => ({ pattern: edgePatternOf(route), zone_name: zone }));

  return localRoutes(placed, where.localHost, where.worker);
}
