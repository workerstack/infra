import { realHost } from "../src/command/real-host.ts";
import { runSet } from "../src/command/run-set.ts";
import { realSetDeps } from "../src/command/set-deps.ts";

export function main(args: readonly string[]): Promise<number> {
  return runSet(args, realHost(), realSetDeps());
}
