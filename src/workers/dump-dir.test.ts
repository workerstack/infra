import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, expect, it } from "vitest";

import { dumpDir } from "./dump-dir.ts";
import { stamp } from "./stamp.ts";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { force: true, recursive: true });
});

it("creates <root>/.tmp/infra/<kind>/ on demand and answers it", () => {
  const root = mkdtempSync(join(tmpdir(), "dump-dir-"));

  roots.push(root);

  const dir = dumpDir(root, "tail");

  expect(dir).toBe(join(root, ".tmp/infra/tail"));
  expect(existsSync(dir)).toBe(true);
  expect(dumpDir(root, "tail")).toBe(dir);
});

it("stamps a date as a file-name-safe timestamp", () => {
  expect(stamp(new Date("2026-11-15T10:00:00.000Z"))).toBe("2026-11-15T10-00-00-000Z");
});
