import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

import { expect, it } from "vitest";

import { env } from "../src/env.ts";
import { PACK_TIMEOUT_MS, PACKED_LINE, PATH_LOADED, RELATIVE_SPECIFIER, SHEBANG } from "./pack.constants.ts";

const PACKAGE = join(import.meta.dirname, "..");
const TRANSPILER = new Bun.Transpiler({ loader: "ts" });

// The files the tarball would hold, as package-relative paths.
function packedFiles(): Set<string> {
  const args = ["pm", "pack", "--dry-run", "--ignore-scripts"];
  const run = spawnSync("bun", args, { cwd: PACKAGE, encoding: "utf8", env });

  expect(run.status).toBe(0);

  return new Set([...run.stdout.matchAll(PACKED_LINE)].map((match) => match[1] ?? ""));
}

// The relative `.ts` files `file` imports; `package.json` is always packed, so it is left out.
function importsOf(file: string): string[] {
  const source = readFileSync(join(PACKAGE, file), "utf8").replace(SHEBANG, "");

  return TRANSPILER.scanImports(source)
    .map((entry) => entry.path)
    .filter((path) => RELATIVE_SPECIFIER.test(path) && path.endsWith(".ts"))
    .map((path) => relative(PACKAGE, join(PACKAGE, dirname(file), path)));
}

// Every file reachable from `entries` through relative imports.
function reachableFrom(entries: readonly string[]): Set<string> {
  const seen = new Set<string>();
  const queue = [...entries];

  for (let file = queue.pop(); file !== undefined; file = queue.pop()) {
    if (seen.has(file)) continue;

    seen.add(file);
    queue.push(...importsOf(file));
  }

  return seen;
}

function commandFiles(): string[] {
  return readdirSync(join(PACKAGE, "cli"))
    .filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts"))
    .map((name) => `cli/${name}`);
}

it(
  "the tarball holds every file the infra bin imports or loads",
  () => {
    const packed = packedFiles();
    const needed = [...reachableFrom(["bin/infra.ts", ...commandFiles()]), ...PATH_LOADED];
    const missing = needed.filter((file) => !packed.has(file));

    expect(needed.every((file) => existsSync(join(PACKAGE, file)))).toBe(true);
    expect(missing).toStrictEqual([]);
    expect(packed.has("package.json")).toBe(true);
  },
  PACK_TIMEOUT_MS,
);
