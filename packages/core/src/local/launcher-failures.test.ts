import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import { fixtureOptions, fixtureProduct, removeRoot, tempRoot } from "./__fixtures__/launcher-fixture.ts";
import { lockFileOf, stackFileOf } from "./__fixtures__/launcher-probes.ts";
import { startStack } from "./start-stack.ts";

const BOOT = 120_000;
const roots: string[] = [];

afterAll(() => {
  for (const root of roots) removeRoot(root);
});

function newRoot(): string {
  const root = tempRoot();

  roots.push(root);

  return root;
}

describe("a stack that cannot start", () => {
  it(
    "fails with the failed child's last lines, and leaves no state or lock",
    async () => {
      const root = newRoot();
      const stack = fixtureProduct(root, "broken");

      writeFileSync(join(root, "a/index.js"), "throw new Error('fixture boom')");
      await expect(startStack(fixtureOptions(root, stack))).rejects.toThrow(
        /workers exited .*last lines:[\s\S]*fixture boom/,
      );
      expect(existsSync(stackFileOf(root))).toBe(false);
      expect(existsSync(lockFileOf(root))).toBe(false);
    },
    BOOT,
  );

  it("fails a container Worker with no Docker, naming the fix", async () => {
    const root = newRoot();
    const stack = fixtureProduct(root, "docker");
    const [a] = stack.members;

    if (a === undefined) throw new Error("no fixture Worker");

    const options = {
      ...fixtureOptions(root, stack),
      docker: () => ({ ok: false, reason: "permission denied" }) as const,
    };

    await expect(startStack({ ...options, members: [{ ...a, container: true }] })).rejects.toThrow(
      "a needs Docker, and `docker info` failed (permission denied): start Docker, or join the docker group",
    );
    expect(existsSync(stackFileOf(root))).toBe(false);
  });
});
