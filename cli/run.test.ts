import { afterEach, describe, expect, test, vi } from "vitest";

import { captureStderr } from "./__fixtures__/capture-stderr.ts";
import { infraRepo } from "./__fixtures__/infra-repo.ts";
import { main } from "./run.ts";

const USAGE_EXIT = 2;
const FAILURE_EXIT = 1;
const CHILD_EXIT = 3;

const ALL_KEYS = {
  CLOUDFLARE_ACCOUNT_EMAIL: "me@example.com",
  CLOUDFLARE_ACCOUNT_ID: "acc",
  CLOUDFLARE_API_KEY: "key",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("infra run", () => {
  test.each([[[]], [["."]]])("%j prints usage and returns the usage exit", async (args: string[]) => {
    const stderr = captureStderr();

    expect(await main(args)).toBe(USAGE_EXIT);
    expect(stderr.lines()).toBe("usage: infra run <dir> <command> [args...]\n");
  });

  test("under vitest prints the guard line and returns 1", async () => {
    const stderr = captureStderr();

    expect(await main([".", "true"])).toBe(FAILURE_EXIT);
    expect(stderr.lines()).toContain("infra run: refusing the account's cloud credentials under a test runner");
  });

  test("a missing key prints its fix line and exits 1", () => {
    const result = infraRepo({}, ["run", ".", "true"]);

    expect(result.code).toBe(FAILURE_EXIT);
    expect(result.stderr).toBe(
      "infra run: CLOUDFLARE_ACCOUNT_EMAIL has no global value; " +
        "run bun repo env set CLOUDFLARE_ACCOUNT_EMAIL --scope global\n",
    );
  });

  test("a missing API key prints that key's line", () => {
    const { CLOUDFLARE_API_KEY: _key, ...keys } = ALL_KEYS;
    const result = infraRepo(keys, ["run", ".", "true"]);

    expect(result.stderr).toBe(
      "infra run: CLOUDFLARE_API_KEY has no global value; run bun repo env set CLOUDFLARE_API_KEY --scope global\n",
    );
  });
});

describe("infra run in a product", () => {
  test("returns the child's exit code", () => {
    expect(infraRepo(ALL_KEYS, ["run", ".", "sh", "-c", "exit 3"]).code).toBe(CHILD_EXIT);
  });

  test("the child sees the product's credentials", () => {
    const result = infraRepo(ALL_KEYS, ["run", ".", "sh", "-c", "echo $CLOUDFLARE_ACCOUNT_ID"]);

    expect(result.stdout).toBe("acc\n");
  });

  test("a dir no product holds is named", () => {
    const result = infraRepo(ALL_KEYS, ["run", "..", "true"]);

    expect(result.stderr).toContain("infra run: no product holds");
  });
});
