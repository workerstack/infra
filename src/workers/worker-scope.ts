import type { Json } from "../shared/json.ts";

/** What a Worker is in one deploy scope: the script it deploys as and the observability its config sets. */
export type WorkerScope = {
  observability?: Json;
  /** The deployed script name: `$metadata.service` in Workers Logs. */
  scriptName: string;
};
