import { localeClaimOf } from "./locale-claim-of.ts";
import { localePatternOf } from "./locale-pattern-of.ts";
import type { LocaleWorkerRoute } from "./locale-worker-route.ts";

/** Every path the routes claim on `host`. */
export function localeRouteSkip(host: string, routes: readonly LocaleWorkerRoute[]): string[] {
  return routes.flatMap((route) => localeClaimOf(host, localePatternOf(route)) ?? []);
}
