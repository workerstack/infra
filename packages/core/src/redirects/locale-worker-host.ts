import { localeHostOf } from "./locale-host-of.ts";
import { localePatternOf } from "./locale-pattern-of.ts";
import type { LocaleWorker } from "./locale-worker.ts";

/** The one host a Worker's prod routes serve. */
export function localeWorkerHost(worker: LocaleWorker): string {
  const hosts = [...new Set(worker.routes.map((route) => localeHostOf(localePatternOf(route))))];
  const [host] = hosts;

  if (host === undefined || hosts.length !== 1) {
    const served = `${hosts.length} hosts (${hosts.join(", ")})`;

    throw new Error(`${worker.dir}: its prod routes serve ${served}; a locale rule is held to one`);
  }

  return host;
}
