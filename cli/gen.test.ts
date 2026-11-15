import { afterEach, expect, it, vi } from "vitest";

import { captureStderr } from "./__fixtures__/capture-stderr.ts";
import { main } from "./gen.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

it("infra gen prints usage and exits 2 for extra args or an unknown flag", async () => {
  const stderr = captureStderr();

  expect(await main(["a", "b"])).toBe(2);
  expect(await main(["--force"])).toBe(2);
  expect(stderr.lines()).toBe("usage: infra gen [name|--all] [--check]\nusage: infra gen [name|--all] [--check]\n");
});

it("infra gen prints the guard line under vitest and exits 1, with or without --check", async () => {
  const stderr = captureStderr();

  expect(await main(["--all"])).toBe(1);
  expect(await main(["--check"])).toBe(1);
  expect(stderr.lines()).toContain("infra gen: refusing the account's cloud credentials under a test runner");
});
