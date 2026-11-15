import { afterEach, describe, expect, it } from "vitest";

import { alive, groupPids, shellGroups, until } from "./__fixtures__/process-probes.ts";
import { execedCmdline } from "./execed-cmdline.ts";
import { stopGroups } from "./stop-groups.ts";

const { start, stopStarted } = shellGroups();

afterEach(stopStarted);

// What /proc shows of a child while it forks and execs: the parent's line, then, mid-exec, an empty one, then its own.
function reads(...lines: (string | undefined)[]): () => string | undefined {
  const queue = [...lines];

  return () => (queue.length > 1 ? queue.shift() : queue[0]);
}

describe("a child's recorded command line", () => {
  it("waits past the parent's line and the empty one mid-exec for the child's own", async () => {
    await expect(execedCmdline(reads("node\0parent", "", "sh\0-c\0sleep 1"), "node\0parent", 1)).resolves.toBe(
      "sh\0-c\0sleep 1",
    );
  });

  it("is empty for a child already gone", async () => {
    await expect(execedCmdline(reads("node\0parent", undefined), "node\0parent", 1)).resolves.toBe("");
  });

  it("fails a child that never execs, naming its pid", async () => {
    await expect(execedCmdline(reads("node\0parent"), "node\0parent", 7)).rejects.toThrow("pid 7 did not exec");
  });
});

describe("child process groups", () => {
  it("reports a child's exit with its last lines", async () => {
    const child = await start("fails", "echo one; echo two; exit 3");

    await expect(child.exited).resolves.toStrictEqual({ code: 3, signal: null });
    expect(child.lastLines()).toStrictEqual(["one", "two"]);
  });

  it("leads its own process group and records its command line", async () => {
    // A second command keeps sh from exec'ing into sleep, so the recorded line is sh's.
    const child = await start("sleeper", "sleep 1000; true");

    expect(child.pgid).toBe(child.pid);
    expect(child.cmdline).toBe("sh\0-c\0sleep 1000; true");
  });

  it("stops a child and its grandchild", async () => {
    const child = await start("parent", "sleep 1000 & sleep 1000");

    // sh, and a sleep in the background and one in the foreground.
    await until(() => groupPids(child.pgid).length === 3);

    const pids = groupPids(child.pgid);

    expect(pids).toHaveLength(3);

    await stopGroups([child]);

    expect(pids.filter((pid) => alive(pid))).toStrictEqual([]);
  });

  it("kills a group that ignores SIGTERM once the grace period ends", async () => {
    const child = await start("stubborn", "trap '' TERM; while true; do sleep 0.05; done");

    await stopGroups([child], 200);

    expect(alive(child.pid)).toBe(false);
  });
});
