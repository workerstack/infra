import type { Json } from "../shared/json.ts";
import type { WorkerRecord } from "./worker-record.ts";

/** A Worker picked for one scope. */
export type WorkerTarget = {
  observability?: Json;
  scriptName: string;
  worker: WorkerRecord;
};
