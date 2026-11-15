import type { SpawnOutput } from "./spawn-output.ts";

/** Runs a command and collects its output; a test passes a fake. */
export type SpawnText = (cmd: string[]) => Promise<SpawnOutput>;
