import { afterEach, expect, it, vi } from "vitest";

import { captureStderr } from "./__fixtures__/capture-stderr.ts";
import { main } from "./db-wipe.ts";

const USAGE = "usage: infra db-wipe [name|--all] --scope dev|prod [--binding NAME...] [--force] [--dry-run]\n";

afterEach(() => {
  vi.restoreAllMocks();
});

it("infra db-wipe prints usage and exits 2 without --scope, for the local scope or an unknown flag", async () => {
  const stderr = captureStderr();

  expect(await main(["web"])).toBe(2);
  expect(await main(["--scope", "local"])).toBe(2);
  expect(await main(["--scope", "dev", "--nope"])).toBe(2);
  expect(stderr.lines()).toBe(USAGE.repeat(3));
});

it("infra db-wipe prints the guard line under vitest and exits 1", async () => {
  const stderr = captureStderr();

  expect(await main(["--scope", "dev"])).toBe(1);
  expect(stderr.lines()).toContain("infra db-wipe: refusing the account's cloud credentials under a test runner");
});
