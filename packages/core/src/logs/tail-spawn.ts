import type { TailChild } from "./tail-child.ts";
import type { TailLaunch } from "./tail-launch.ts";

/** Starts a tail; a test passes a fake. */
export type TailSpawn = (launch: TailLaunch) => TailChild;
