import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { realNode } from "./real-node.ts";

const dirs: string[] = [];

function dirWith(file: string): string {
  const dir = mkdtempSync(join(tmpdir(), "real-node-"));

  dirs.push(dir);
  writeFileSync(join(dir, file), "");
  chmodSync(join(dir, file), 0o755);

  return dir;
}

afterEach(() => {
  vi.unstubAllEnvs();

  for (const dir of dirs.splice(0)) rmSync(dir, { force: true, recursive: true });
});

describe("realNode", () => {
  it("looks for node.exe on win32", () => {
    const dir = dirWith("node.exe");

    vi.stubEnv("PATH", dir);

    expect(realNode("win32")).toBe(join(dir, "node.exe"));
  });

  it("does not take a bare node on win32", () => {
    vi.stubEnv("PATH", dirWith("node"));

    expect(() => realNode("win32")).toThrow("no node is on PATH");
  });

  it("looks for node elsewhere", () => {
    const dir = dirWith("node");

    vi.stubEnv("PATH", dir);

    expect(realNode("linux")).toBe(join(dir, "node"));
  });
});
