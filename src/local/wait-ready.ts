import { setTimeout as sleep } from "node:timers/promises";

import { MS_PER_SECOND } from "../shared/ms-per-second.constants.ts";
import type { Child, ChildExit } from "./child.ts";
import { crashReport } from "./crash-report.ts";
import { READY_POLL_MS, READY_PROBE_MS, READY_TIMEOUT_MS } from "./local.constants.ts";

async function answers(url: string): Promise<boolean> {
  try {
    await fetch(url, { signal: AbortSignal.timeout(READY_PROBE_MS) });

    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves once anything answers HTTP on `url` (a dispatcher 404 counts); fails with the child's last lines if it
 * exits first, or when it does not answer in time.
 */
export function waitReady(url: string, child: Child): Promise<void> {
  let exit: ChildExit | undefined;
  const deadline = Date.now() + READY_TIMEOUT_MS;

  void child.exited.then((how) => {
    exit = how;
  });

  async function probe(): Promise<void> {
    if (exit !== undefined) throw new Error(crashReport(child, exit));

    if (await answers(url)) return;

    if (Date.now() > deadline)
      throw new Error(`${child.name} did not answer on ${url} in ${READY_TIMEOUT_MS / MS_PER_SECOND} s`);

    await sleep(READY_POLL_MS);

    return probe();
  }

  return probe();
}
