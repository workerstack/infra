import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { SLEEP, abandoning, alive, groupPids, nodeGroups, parentOf, until } from "./__fixtures__/process-probes.ts";
import { clearOrphans } from "./clear-orphans.ts";
import { writeLock } from "./write-lock.ts";

const { start, stopStarted } = nodeGroups();
const dirs: string[] = [];

afterEach(async () => {
  await stopStarted();

  for (const dir of dirs.splice(0)) rmSync(dir, { force: true, recursive: true });
});

function lockFile(): string {
  const dir = mkdtempSync(join(tmpdir(), "loc-lock-"));

  dirs.push(dir);

  return join(dir, "loc", "lock.json");
}

describe("orphans of a live leader", () => {
  it("stops a recorded group whose command line still matches, and spares a pid that changed hands", async () => {
    const lock = lockFile();
    const orphan = await start("orphan", parentOf(parentOf(SLEEP)));
    const stranger = await start("stranger", SLEEP);

    await until(() => groupPids(orphan.pgid).length === 3);

    const orphanPids = groupPids(orphan.pgid);

    writeLock(lock, [orphan, { ...stranger, cmdline: "node -e something else" }]);
    await clearOrphans(lock);

    expect(orphanPids.filter((pid) => alive(pid))).toStrictEqual([]);
    expect(alive(stranger.pid)).toBe(true);
    expect(existsSync(lock)).toBe(false);
  });
});

describe("orphans of a gone leader", () => {
  it("stops what a group whose leader exited left running", async () => {
    const lock = lockFile();
    const leader = await start("leader", abandoning(SLEEP));

    await leader.exited;

    const left = groupPids(leader.pgid);

    expect(left).toHaveLength(1);

    writeLock(lock, [leader]);
    await clearOrphans(lock);

    expect(left.filter((pid) => alive(pid))).toStrictEqual([]);
  });

  it("is a no-op with no lock file, and refuses a file that is not a lock", async () => {
    const lock = lockFile();

    await expect(clearOrphans(lock)).resolves.toBeUndefined();

    writeLock(lock, []);
    writeFileSync(lock, "{");

    await expect(clearOrphans(lock)).rejects.toThrow(`${lock} is not a stack lock`);
  });
});
