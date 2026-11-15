import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { peerBin } from "./peer-bin.ts";

const roots: string[] = [];

type Manifest = { bin?: Record<string, string> | string };

function repoWith(manifest: Manifest | null): string {
  const root = mkdtempSync(join(tmpdir(), "peer-bin-"));

  roots.push(root);
  writeFileSync(join(root, "package.json"), "{}");

  if (manifest !== null) {
    const dir = join(root, "node_modules", "example-tool");

    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "example-tool", ...manifest }));
  }

  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { force: true, recursive: true });
});

describe("peerBin", () => {
  it("resolves a bin record entry next to the package manifest", () => {
    const root = repoWith({ bin: { tool: "./bin/tool.js" } });

    expect(peerBin(root, "example-tool", "tool")).toBe(join(root, "node_modules", "example-tool", "bin", "tool.js"));
  });

  it("takes a lone bin path as the binary asked for", () => {
    const root = repoWith({ bin: "run.js" });

    expect(peerBin(root, "example-tool", "tool")).toBe(join(root, "node_modules", "example-tool", "run.js"));
  });

  it("says how to install a package that is missing", () => {
    expect(() => peerBin(repoWith(null), "example-tool", "tool")).toThrow(
      "the example-tool package is not installed; run bun add -d example-tool",
    );
  });

  it("says so when the package declares no such binary", () => {
    expect(() => peerBin(repoWith({ bin: { other: "o.js" } }), "example-tool", "tool")).toThrow(
      "the example-tool package declares no tool binary; reinstall it with bun add -d example-tool",
    );
  });
});
