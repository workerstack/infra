import { spawnSync } from "node:child_process";
import { appendFileSync, cpSync, globSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, expect, it } from "vitest";

import { env } from "../src/env.ts";

const PACKAGE = join(import.meta.dirname, "..");
const BIN = join(PACKAGE, "bin", "infra.ts");

// Under the package, so the copy still resolves `cf/config`, `@cloudflare/config` and `wrangler`.
const WORK = join(PACKAGE, ".tmp");

const GEN_TIMEOUT = 120_000;
const made: string[] = [];

// A repo-shaped copy of the fixture product as `apps/web`, its imports of the package's source made absolute.
function copyFixture() {
  mkdirSync(WORK, { recursive: true });

  const root = mkdtempSync(join(WORK, "gen-"));
  const web = join(root, "apps/web");

  made.push(root);
  mkdirSync(join(root, ".git"));
  cpSync(join(import.meta.dirname, "__fixtures__/product"), web, { recursive: true });

  for (const file of globSync("**/*.ts", { cwd: web })) {
    const path = join(web, file);

    writeFileSync(path, readFileSync(path, "utf8").replaceAll('from "../../../src/', `from "${PACKAGE}/src/`));
  }

  return { generated: join(web, "api/.cloudflare"), web: root };
}

// `infra gen` as a subprocess in `cwd`, with the test-runner markers cleared so the guard lets it run.
function infraGen(cwd: string, ...args: string[]) {
  const { NODE_ENV: _node, VITEST: _vitest, ...clean } = env;
  const result = spawnSync("bun", ["--no-install", BIN, "gen", ...args], { cwd, encoding: "utf8", env: clean });

  return { code: result.status, stderr: result.stderr, stdout: result.stdout };
}

afterEach(() => {
  for (const root of made.splice(0)) rmSync(root, { force: true, recursive: true });
});

it(
  "infra gen writes each scope's wrangler config and .dev.vars, and --check passes until one is edited",
  () => {
    const { generated, web } = copyFixture();
    const run = infraGen(web);

    expect(run.stderr).toBe("");
    expect(run.code).toBe(0);
    expect(run.stdout).toContain("wrote apps/web/api/.cloudflare/wrangler.local.json");

    for (const scope of ["local", "dev", "prod"]) {
      const wrangler: unknown = JSON.parse(readFileSync(join(generated, `wrangler.${scope}.json`), "utf8"));

      expect(wrangler).toMatchObject({
        d1_databases: [{ binding: "DB", database_name: `db-${scope}` }],
        vars: { GREETING: `hi ${scope}` },
      });
    }

    expect(infraGen(web, "--check").code).toBe(0);

    appendFileSync(join(generated, "wrangler.dev.json"), " ");

    const drift = infraGen(web, "--check");

    expect(drift.code).toBe(1);
    expect(drift.stderr).toContain(
      "infra gen: apps/web: apps/web/api/.cloudflare/wrangler.dev.json is out of date; run infra gen",
    );
  },
  GEN_TIMEOUT,
);
