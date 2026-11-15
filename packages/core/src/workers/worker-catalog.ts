import type { WorkerRecord } from "./worker-record.ts";

/** Every Worker under `root`, sorted by package dir. */
export type WorkerCatalog = { root: string; workers: WorkerRecord[] };
