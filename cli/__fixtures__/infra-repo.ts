import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { env } from "../../src/env.ts";

const BIN = join(import.meta.dirname, "..", "..", "bin", "infra.ts");
const DEFINE = pathToFileURL(join(import.meta.dirname, "..", "..", "src", "define-infra-config.ts")).href;

export type InfraRun = { code: number | null; stderr: string; stdout: string };

/** Runs `bun bin/infra.ts <args>` in a temp repo (a stub `cf` package unless `withCf` is false) whose one product's env has `global`; VITEST and NODE_ENV cleared. */
export function infraRepo(global: Record<string, string>, args: readonly string[], withCf = true): InfraRun {
  const repo = mkdtempSync(join(tmpdir(), "infra-cli-"));

  mkdirSync(join(repo, ".git"));
  writeFileSync(
    join(repo, "infra.config.ts"),
    `import { defineInfraConfig } from ${JSON.stringify(DEFINE)};\n` +
      `export default defineInfraConfig({ env: { dev: {}, global: ${JSON.stringify(global)}, local: {}, prod: {} } });\n`,
  );

  if (withCf) writeStubCf(join(repo, "node_modules", "cf"));

  const { NODE_ENV: _node, VITEST: _vitest, ...clean } = env;
  const result = spawnSync("bun", ["--no-install", BIN, ...args], { cwd: repo, encoding: "utf8", env: clean });

  rmSync(repo, { force: true, recursive: true });

  return { code: result.status, stderr: result.stderr, stdout: result.stdout };
}

function writeStubCf(cf: string): void {
  mkdirSync(cf, { recursive: true });
  writeFileSync(join(cf, "package.json"), JSON.stringify({ bin: { cf: "cf.js" }, name: "cf" }));
  writeFileSync(join(cf, "cf.js"), "console.log(process.env.CLOUDFLARE_API_TOKEN, process.argv.slice(2).join(' '));\n");
}
