import type { ProbeIo } from "./probe-io.ts";
import type { SpawnText } from "./spawn-text.ts";

/** The edges `infra probe` runs through: the terminal and the system `curl`. */
export type ProbeDeps = { io: ProbeIo; spawnText: SpawnText };
