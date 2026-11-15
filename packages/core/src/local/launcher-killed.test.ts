import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import { fixtureOptions, fixtureProduct, removeRoot, tempRoot } from "./__fixtures__/launcher-fixture.ts";
import { ask, textOf, lockFileOf, seen } from "./__fixtures__/launcher-probes.ts";
import { until } from "./__fixtures__/process-probes.ts";
import { type LockedChild, lockSchema } from "./locked-child.ts";
import { processOf } from "./process-of.ts";
import type { ProcessRow } from "./process-row.ts";
import type { RunningStack } from "./stack-options.ts";
import { startStack } from "./start-stack.ts";

const BOOT = 120_000;
const root = tempRoot();
const MARK = "killed";
const started: RunningStack[] = [];

afterAll(async () => {
  await Promise.all(started.map((stack) => stack.stop()));
  removeRoot(root);
});

// Runs the fixture child until it prints the table, then kills it with SIGKILL: its children stay.
async function killedRun(): Promise<LockedChild[]> {
  const launcher = spawn("bun", [join(import.meta.dirname, "__fixtures__/launcher-child.ts"), root, MARK], {
    stdio: ["ignore", "pipe", "ignore"],
  });

  const out = { text: "" };

  launcher.stdout.on("data", (chunk: Buffer) => (out.text += chunk.toString()));
  await until(() => out.text.includes("local stack at"), 60_000);
  expect(out.text).toContain("local stack at");

  const lock = lockSchema().parse(JSON.parse(readFileSync(lockFileOf(root), "utf8")));
  const closed = new Promise((resolve) => launcher.once("close", resolve));

  launcher.kill("SIGKILL");
  await closed;

  return lock.children;
}

// Each locked child that is still the same process, by its pid and start time (Windows soon hands a freed pid to a
// new process), with the row it has now, so a failure shows why it was spared.
function stillAlive(children: readonly LockedChild[]): { locked: LockedChild; now: ProcessRow }[] {
  return children.flatMap((child) => {
    const now = processOf(child.pid);

    return now !== undefined && now.start === child.start ? [{ locked: child, now }] : [];
  });
}

describe("a stack after its launcher is killed", () => {
  it(
    "stops what the killed run left on the next start, which then serves",
    async () => {
      const left = await killedRun();

      expect(stillAlive(left)).toHaveLength(left.length);

      const next = await startStack(fixtureOptions(root, fixtureProduct(root, "next")));

      started.push(next);
      expect(stillAlive(left)).toStrictEqual([]);
      expect(await textOf(ask(next, "fx-a-local", "?m=next"))).toBe("sent");
      expect(await seen(next, "next")).toBe("next next");
    },
    BOOT * 2,
  );
});
