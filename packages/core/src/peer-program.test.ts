import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { realNode } from "./local/real-node.ts";
import { peerProgram } from "./peer-program.ts";

const roots: string[] = [];

function repoWith(bin: string, text: string): string {
  const root = mkdtempSync(join(tmpdir(), "peer-program-"));
  const dir = join(root, "node_modules", "example-tool");

  roots.push(root);
  writeFileSync(join(root, "package.json"), "{}");
  mkdirSync(dirname(join(dir, bin)), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ bin: { tool: bin }, name: "example-tool" }));
  writeFileSync(join(dir, bin), text);

  return root;
}

function binPath(root: string, bin: string): string {
  return join(root, "node_modules", "example-tool", bin);
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { force: true, recursive: true });
});

describe("peerProgram", () => {
  it("runs an extensionless bin with an env node shebang under the real node", () => {
    const root = repoWith("./bin/tool", "#!/usr/bin/env node\nconsole.log(1);\n");

    expect(peerProgram(root, "example-tool", "tool")).toStrictEqual({
      args: [binPath(root, "./bin/tool")],
      file: realNode(),
    });
  });

  it("runs an env -S node shebang under the real node", () => {
    const root = repoWith("bin/tool.js", "#!/usr/bin/env -S node --no-warnings\n");

    expect(peerProgram(root, "example-tool", "tool").file).toBe(realNode());
  });

  it("runs a shebang naming a node path under the real node", () => {
    const root = repoWith("bin/tool", "#!/usr/local/bin/node\n");

    expect(peerProgram(root, "example-tool", "tool").file).toBe(realNode());
  });

  it("runs a bun shebang under the current runtime", () => {
    const root = repoWith("bin/tool", "#!/usr/bin/env bun\n");

    expect(peerProgram(root, "example-tool", "tool")).toStrictEqual({
      args: [binPath(root, "bin/tool")],
      file: process.execPath,
    });
  });
});

describe("peerProgram without a node shebang", () => {
  it("runs a .js bin without a shebang under the current runtime", () => {
    const root = repoWith("bin/tool.js", "console.log(1);\n");

    expect(peerProgram(root, "example-tool", "tool")).toStrictEqual({
      args: [binPath(root, "bin/tool.js")],
      file: process.execPath,
    });
  });

  it("runs a .ts bin under the current runtime", () => {
    const root = repoWith("bin/tool.ts", "console.log(1);\n");

    expect(peerProgram(root, "example-tool", "tool")).toStrictEqual({
      args: [binPath(root, "bin/tool.ts")],
      file: process.execPath,
    });
  });

  it("names the bin when no runtime is known for it", () => {
    const root = repoWith("bin/tool", "plain text\n");

    expect(() => peerProgram(root, "example-tool", "tool")).toThrow(/tool.*no runtime infra knows/);
  });
});
