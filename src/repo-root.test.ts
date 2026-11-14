import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { repoRoot } from "./repo-root.ts";

let root = "";

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "repo-root-"));
  mkdirSync(join(root, "a/b"), { recursive: true });
});

afterEach(() => {
  rmSync(root, { force: true, recursive: true });
});

describe("repoRoot", () => {
  it("finds a .git directory above", () => {
    mkdirSync(join(root, ".git"));

    expect(repoRoot(join(root, "a/b"))).toBe(root);
  });

  it("finds a .git file above, as a worktree has", () => {
    writeFileSync(join(root, ".git"), "gitdir: elsewhere");

    expect(repoRoot(join(root, "a/b"))).toBe(root);
  });

  it("prefers the nearest .git", () => {
    mkdirSync(join(root, ".git"));
    writeFileSync(join(root, "a/.git"), "gitdir: elsewhere");

    expect(repoRoot(join(root, "a/b"))).toBe(join(root, "a"));
  });

  it("throws when no .git is above", () => {
    expect(() => repoRoot(join(root, "a/b"))).toThrow(`no git repository above ${join(root, "a/b")}`);
  });
});
