import { afterEach, expect, it, vi } from "vitest";

import { captureStderr } from "./__fixtures__/capture-stderr.ts";
import { main } from "./db-migrate.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

it("infra db-migrate prints usage and exits 2 for extra args, the local scope or an unknown flag", async () => {
  const stderr = captureStderr();

  expect(await main(["a", "b"])).toBe(2);
  expect(await main(["--scope", "local"])).toBe(2);
  expect(await main(["--force"])).toBe(2);
  expect(stderr.lines()).toBe("usage: infra db-migrate [name|--all] [--scope dev|prod]\n".repeat(3));
});

it("infra db-migrate prints the guard line under vitest and exits 1", async () => {
  const stderr = captureStderr();

  expect(await main(["--all"])).toBe(1);
  expect(stderr.lines()).toContain("infra db-migrate: refusing the account's cloud credentials under a test runner");
});
