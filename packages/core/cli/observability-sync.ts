import { realHost } from "../src/command/real-host.ts";
import { runObservabilitySync } from "../src/observability/run-observability-sync.ts";
import { loadWorkers } from "../src/workers/load-workers.ts";

export function main(args: readonly string[]): Promise<number> {
  return runObservabilitySync(args, { ...realHost(), fetcher: fetch, load: loadWorkers });
}
