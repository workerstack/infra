import { cfTypes } from "../src/cf-config/cf-types.ts";
import { realHost } from "../src/command/real-host.ts";
import { runGen } from "../src/command/run-gen.ts";
import { stdoutLog } from "../src/shared/stdout-log.ts";

export function main(args: readonly string[]): Promise<number> {
  return runGen(args, realHost(), { log: stdoutLog, runTypes: cfTypes });
}
