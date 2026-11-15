import type { CfFetch } from "../api/cf-fetch.ts";
import type { CommandHost } from "../command/command-host.ts";
import type { WorkerCatalog } from "../workers/worker-catalog.ts";

/** The edges `infra observability-sync` runs through: the command host, the Worker scan and the Cloudflare fetch. */
export type ObservabilityHost = Pick<CommandHost, "cwd" | "guard" | "root" | "stderr" | "stdout"> & {
  fetcher: CfFetch;
  load: (root: string) => Promise<WorkerCatalog>;
};
