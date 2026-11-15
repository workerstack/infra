import { afterEach, describe, expect, test, vi } from "vitest";

import { captureStderr } from "./__fixtures__/capture-stderr.ts";
import { infraRepo } from "./__fixtures__/infra-repo.ts";
import { main } from "./cf.ts";

const USAGE_EXIT = 2;
const FAILURE_EXIT = 1;

const KEYS = { CLOUDFLARE_ACCOUNT_ID: "acc", CLOUDFLARE_API_TOKEN: "tok" };

afterEach(() => {
  vi.restoreAllMocks();
});

describe("infra cf", () => {
  test("no args prints usage and returns the usage exit", async () => {
    const stderr = captureStderr();

    expect(await main([])).toBe(USAGE_EXIT);
    expect(stderr.lines()).toBe("usage: infra cf [args...]\n");
  });

  test("under vitest prints the guard line and returns 1", async () => {
    const stderr = captureStderr();

    expect(await main(["zones", "list"])).toBe(FAILURE_EXIT);
    expect(stderr.lines()).toContain("infra cf: refusing the account's cloud credentials under a test runner");
  });

  test("a missing token prints its fix line and exits 1", () => {
    const result = infraRepo({ CLOUDFLARE_ACCOUNT_ID: "acc" }, ["cf", "zones", "list"]);

    expect(result.code).toBe(FAILURE_EXIT);
    expect(result.stderr).toBe(
      "infra cf: CLOUDFLARE_API_TOKEN has no global value; run bun repo env set CLOUDFLARE_API_TOKEN --scope global\n",
    );
  });

  test("runs the installed cf with the product's token and the args", () => {
    const result = infraRepo(KEYS, ["cf", "zones", "list"]);

    expect(result).toStrictEqual({ code: 0, stderr: "", stdout: "tok zones list\n" });
  });

  test("a repo without the cf package says how to install it", () => {
    const result = infraRepo(KEYS, ["cf", "zones", "list"], false);

    expect(result.code).toBe(FAILURE_EXIT);
    expect(result.stderr).toBe("infra cf: the cf package is not installed; run bun add -d cf\n");
  });
});
