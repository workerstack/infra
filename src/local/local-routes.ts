import { NO_INDEX } from "../shared/no-index.constants.ts";
import type { LocalRoute } from "./local-route.ts";

/** A route as a Wrangler config lists it once its zone is known. */
type ZoneRoute = { pattern: string; zone_name: string };

/** A pattern's host without its wildcard, and which wildcard it had. */
type SplitHost = { bare: string; hostWildcard: LocalRoute["hostWildcard"] };

const WILDCARD = "*";
const SUBDOMAIN_WILDCARD = "*.";

function splitWildcard(patternHost: string): SplitHost {
  if (patternHost.startsWith(SUBDOMAIN_WILDCARD))
    return { bare: patternHost.slice(SUBDOMAIN_WILDCARD.length), hostWildcard: "subdomains" };

  if (patternHost.startsWith(WILDCARD))
    return { bare: patternHost.slice(WILDCARD.length), hostWildcard: "host-and-subdomains" };

  return { bare: patternHost, hostWildcard: false };
}

function localHostOf(bare: string, zone: string, localHost: string): string | undefined {
  if (bare === zone) return localHost;

  return bare.endsWith(`.${zone}`) ? `${bare.slice(0, -zone.length)}${localHost}` : undefined;
}

/**
 * Each prod route of `worker` on its zone, moved onto `localHost`: `example.com/api/*` on zone `example.com` becomes
 * `example.localhost/api/*`, `api.example.com` becomes `api.example.localhost`. A pattern off its zone fails.
 */
export function localRoutes(routes: readonly ZoneRoute[], localHost: string, worker: string): LocalRoute[] {
  return routes.map(({ pattern, zone_name: zone }) => {
    const slash = pattern.indexOf("/");
    const patternPath = slash === NO_INDEX ? "/" : pattern.slice(slash);
    const { bare, hostWildcard } = splitWildcard(slash === NO_INDEX ? pattern : pattern.slice(0, slash));
    const host = localHostOf(bare, zone, localHost);

    if (host === undefined) throw new Error(`${worker}: route ${pattern} is not on its zone ${zone}`);

    const prefix = patternPath.endsWith(WILDCARD);

    return { host, hostWildcard, path: prefix ? patternPath.slice(0, -WILDCARD.length) : patternPath, prefix, worker };
  });
}
