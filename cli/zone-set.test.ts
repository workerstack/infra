import { afterEach, expect, it, vi } from "vitest";

import { captureStderr } from "./__fixtures__/capture-stderr.ts";
import { main } from "./zone-set.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

it("infra zone-set prints usage and exits 2 for extra args or an unknown flag", async () => {
  const stderr = captureStderr();

  expect(await main(["a", "b"])).toBe(2);
  expect(await main(["--force"])).toBe(2);
  expect(stderr.lines()).toBe("usage: infra zone-set [name|--all]\nusage: infra zone-set [name|--all]\n");
});

it("infra zone-set prints the guard line under vitest and exits 1", async () => {
  const stderr = captureStderr();

  expect(await main(["--all"])).toBe(1);
  expect(stderr.lines()).toContain("infra zone-set: refusing the account's cloud credentials under a test runner");
});
