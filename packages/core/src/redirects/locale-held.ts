import { localeRouteSkip } from "./locale-route-skip.ts";
import type { LocaleWorker } from "./locale-worker.ts";

/** The conditions that hold an app's rules to its host, off the paths the other Workers claim. */
export function localeHeld(host: string, app: LocaleWorker, workers: readonly LocaleWorker[]): string {
  // A package sharing another's Worker repeats its routes; each path is stated once.
  const skip = [
    ...new Set(
      workers.filter((worker) => worker.name !== app.name).flatMap((worker) => localeRouteSkip(host, worker.routes)),
    ),
  ];

  return [`http.host eq "${host}"`, ...(skip.length > 0 ? [`not (${skip.join(" or ")})`] : [])].join(" and ");
}
