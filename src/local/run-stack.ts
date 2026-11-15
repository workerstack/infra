import type { Log } from "../shared/log.ts";
import { crashReport } from "./crash-report.ts";
import type { StackOptions } from "./stack-options.ts";
import { startStack } from "./start-stack.ts";

/**
 * The command's life: start, log the table, and stop everything on `stopSignal` (Ctrl-C, SIGTERM) or on the first
 * child that exits, which fails with its last lines.
 */
export async function runStack(options: StackOptions, stopSignal: Promise<void>, log: Log): Promise<void> {
  const stack = await startStack(options);

  log(stack.table);

  const ended = await Promise.race([stack.failed, stopSignal.then(() => null)]);

  if (ended === null) {
    await stack.stop();

    return;
  }

  throw new Error(`${crashReport(ended, await ended.exited)}\nstopped the local stack`);
}
