import type { LocaleWorkerRoute } from "./locale-worker-route.ts";

/** The pattern of a route. */
export function localePatternOf(route: LocaleWorkerRoute): string {
  return route.pattern;
}
