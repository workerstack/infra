import { realHost } from "../src/command/real-host.ts";
import { runLoc } from "../src/command/run-loc.ts";
import { stdoutLog } from "../src/shared/stdout-log.ts";

// Ctrl-C or SIGTERM: the stack stops every child and removes its state and lock files before the command returns.
function stopSignal(): Promise<void> {
  return new Promise((resolve) => {
    process.once("SIGINT", () => {
      resolve();
    });
    process.once("SIGTERM", () => {
      resolve();
    });
  });
}

export function main(args: readonly string[]): Promise<number> {
  return runLoc(args, realHost(), { log: stdoutLog, stopSignal: stopSignal() });
}
