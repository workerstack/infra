import { realProbeIo } from "../src/probe/real-probe-io.ts";
import { runProbeCommand } from "../src/probe/run-probe-command.ts";
import { spawnChild } from "../src/probe/spawn-child.ts";

export function main(args: readonly string[]): Promise<number> {
  return runProbeCommand(args, { io: realProbeIo(), spawnText: spawnChild });
}
