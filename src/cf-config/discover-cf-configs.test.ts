import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, expect, it } from "vitest";

import { discoverCfConfigs } from "./discover-cf-configs.ts";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { force: true, recursive: true });
});

function tree(files: string[]): string {
  const root = mkdtempSync(join(tmpdir(), "cf-discover-"));

  roots.push(root);

  for (const file of files) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), "");
  }

  return root;
}

it("lists every cloudflare.config.ts under the product, sorted, outside installed packages, git and worktrees", () => {
  const root = tree([
    "api/b/cloudflare.config.ts",
    "api/a/cloudflare.config.ts",
    "api/a/not-it.config.ts",
    "node_modules/pkg/cloudflare.config.ts",
    ".git/x/cloudflare.config.ts",
    ".worktrees/branch/api/cloudflare.config.ts",
  ]);

  expect(discoverCfConfigs(root)).toStrictEqual([
    join(root, "api/a/cloudflare.config.ts"),
    join(root, "api/b/cloudflare.config.ts"),
  ]);
});

it("leaves out the Workers of a nested product, which has its own infra.config.ts", () => {
  const root = tree(["cloudflare.config.ts", "apps/docs/infra.config.ts", "apps/docs/cloudflare.config.ts"]);

  expect(discoverCfConfigs(root)).toStrictEqual([join(root, "cloudflare.config.ts")]);
});
