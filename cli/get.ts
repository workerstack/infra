import { realGetDeps } from "../src/command/get-deps.ts";
import { realHost } from "../src/command/real-host.ts";
import { runGet } from "../src/command/run-get.ts";

export function main(args: readonly string[]): Promise<number> {
  return runGet(args, realHost(), realGetDeps());
}
