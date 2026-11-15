import type { Log } from "../shared/log.ts";

/** Where a tail's output goes: the dump, the summary lines and the errors. */
export type TailSink = { dump: (line: string) => void; stderr: Log; stdout: Log };
