import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { DEFINING_ENV, envRepo, PLAIN_ENV, removeEnvRepos } from "./__fixtures__/env-repo.ts";
import { secretsWriter } from "./secrets-writer.ts";

const ONE = { key: "EXAMPLE_ONE", scope: "prod", value: "s3cret-one" } as const;
const TWO = { key: "EXAMPLE_TWO", scope: "dev", value: "s3cret-two" } as const;

afterEach(removeEnvRepos);

describe("writeSecrets spawn", () => {
  it("passes env set args and the value on stdin, never in args", async () => {
    const repo = await envRepo(DEFINING_ENV, 0);
    const bin = join(repo.root, "node_modules", "@workerstack", "repo", "bin", "repo.ts");

    await secretsWriter(repo.deps)(repo.root, repo.product, [ONE, TWO]);

    expect(repo.calls.map(({ args, cwd, stdin }) => ({ args, cwd, stdin }))).toStrictEqual([
      {
        args: [bin, "env", "set", "EXAMPLE_ONE", "--scope", "prod", "--file", "apps/web/env.ts"],
        cwd: repo.root,
        stdin: "s3cret-one",
      },
      {
        args: [bin, "env", "set", "EXAMPLE_TWO", "--scope", "dev", "--file", "apps/web/env.ts"],
        cwd: repo.root,
        stdin: "s3cret-two",
      },
    ]);
  });

  it("runs the current binary and logs each write", async () => {
    const repo = await envRepo(DEFINING_ENV, 0);

    await secretsWriter(repo.deps)(repo.root, repo.product, [ONE, TWO]);

    expect(repo.calls.map((call) => call.command)).toStrictEqual([process.execPath, process.execPath]);
    expect(repo.lines).toStrictEqual([
      "wrote EXAMPLE_ONE (prod) with bun repo env set",
      "wrote EXAMPLE_TWO (dev) with bun repo env set",
    ]);
  });
});

describe("writeSecrets refusals", () => {
  it("throws the Usage line when no env file calls defineEnv", async () => {
    const repo = await envRepo(PLAIN_ENV, 0);

    await expect(secretsWriter(repo.deps)(repo.root, repo.product, [ONE])).rejects.toThrow(
      "no env file under apps/web exports the config's env; define it with defineEnv beside infra.config.ts",
    );
    expect(repo.calls).toStrictEqual([]);
  });

  it("names the key and scope when env set exits nonzero", async () => {
    const repo = await envRepo(DEFINING_ENV, 1);

    await expect(secretsWriter(repo.deps)(repo.root, repo.product, [ONE])).rejects.toThrow(
      "bun repo env set EXAMPLE_ONE (prod) exited 1",
    );
    expect(repo.lines).toStrictEqual([]);
  });

  it("spawns nothing for an empty list", async () => {
    const repo = await envRepo(PLAIN_ENV, 0);

    await secretsWriter(repo.deps)(repo.root, repo.product, []);

    expect(repo.calls).toStrictEqual([]);
  });
});
