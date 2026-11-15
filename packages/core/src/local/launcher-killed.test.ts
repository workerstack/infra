import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import { fixtureOptions, fixtureProduct, removeRoot, tempRoot } from "./__fixtures__/launcher-fixture.ts";
import { ask, textOf, lockFileOf, seen } from "./__fixtures__/launcher-probes.ts";
import { alive, until } from "./__fixtures__/process-probes.ts";
import { lockSchema } from "./locked-child.ts";
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
async function killedRun(): Promise<number[]> {
  const launcher = spawn("bun", [join(import.meta.dirname, "__fixtures__/launcher-child.ts"), root, MARK], {
    stdio: ["ignore", "pipe", "ignore"],
  });

  const out = { text: "" };

  launcher.stdout.on("data", (chunk: Buffer) => (out.text += chunk.toString()));
  await until(() => out.text.includes("local stack at"), 1200);
  expect(out.text).toContain("local stack at");

  const lock = lockSchema().parse(JSON.parse(readFileSync(lockFileOf(root), "utf8")));
  const closed = new Promise((resolve) => launcher.once("close", resolve));

  launcher.kill("SIGKILL");
  await closed;

  return lock.children.map((child) => child.pid);
}

describe("a stack after its launcher is killed", () => {
  it(
    "stops what the killed run left on the next start, which then serves",
    async () => {
      const left = await killedRun();

      expect(left.filter((pid) => alive(pid))).toStrictEqual(left);

      const next = await startStack(fixtureOptions(root, fixtureProduct(root, "next")));

      started.push(next);
      expect(left.filter((pid) => alive(pid))).toStrictEqual([]);
      expect(await textOf(ask(next, "fx-a-local", "?m=next"))).toBe("sent");
      expect(await seen(next, "next")).toBe("next next");
    },
    BOOT * 2,
  );
});
