import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, it } from "vitest";

import { writeAtomic } from "./write-atomic.ts";

it("replaces the file and leaves no temp file behind", () => {
  const dir = mkdtempSync(join(tmpdir(), "atomic-write-"));
  const target = join(dir, "config.json");

  writeFileSync(target, "old");
  writeAtomic(target, "new");

  expect(readFileSync(target, "utf8")).toBe("new");
  expect(readdirSync(dir)).toStrictEqual(["config.json"]);
  rmSync(dir, { force: true, recursive: true });
});
