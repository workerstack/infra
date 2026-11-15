import { setTimeout as sleep } from "node:timers/promises";

import { MS_PER_SECOND } from "../shared/ms-per-second.constants.ts";
import { EXEC_POLL_MS, EXEC_POLLS } from "./local.constants.ts";

/**
 * The child's cmdline once it has exec'd, from `read` (its /proc cmdline; `undefined` once gone): until then /proc
 * shows the parent's own, and mid-exec an empty one, neither of which a later orphan check could match. A child
 * already gone has `""`, which nothing a later run finds can match either.
 */
export function execedCmdline(
  read: () => string | undefined,
  parent: string | undefined,
  pid: number,
): Promise<string> {
  const limit = `pid ${pid} did not exec within ${(EXEC_POLLS * EXEC_POLL_MS) / MS_PER_SECOND} s`;

  async function poll(left: number): Promise<string> {
    const own = read();

    if (own === undefined) return "";

    if (own !== parent && own !== "") return own;

    if (left === 0) throw new Error(limit);

    await sleep(EXEC_POLL_MS);

    return poll(left - 1);
  }

  return poll(EXEC_POLLS);
}
