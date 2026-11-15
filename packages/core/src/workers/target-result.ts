import type { WorkerTarget } from "./worker-target.ts";

/** The Workers a command acts on, or the line saying why none. */
export type TargetResult = { error: string; ok: false } | { ok: true; targets: WorkerTarget[] };
