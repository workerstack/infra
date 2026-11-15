import type { Log } from "../shared/log.ts";
import type { WorkerCatalog } from "../workers/worker-catalog.ts";

/** The edges a logs command runs through: the dir, the Worker scan, the test-runner guard, signals and output. */
export type LogsHost = {
  cwd: string;
  guard: () => void;
  load: (root: string) => Promise<WorkerCatalog>;
  /** Calls `stop` on an interrupt; returns the call that stops listening. */
  onStop: (stop: () => void) => () => void;
  root: (cwd: string) => string;
  stderr: Log;
  stdout: Log;
};
