import { afterEach, expect, it, vi } from "vitest";

import { captureStderr } from "./__fixtures__/capture-stderr.ts";
import { main } from "./observability-sync.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

it("infra observability-sync prints usage and exits 2 without a Worker or for an unknown flag", async () => {
  const stderr = captureStderr();

  expect(await main([])).toBe(2);
  expect(await main(["web-api", "--env", "prod"])).toBe(2);
  expect(stderr.lines()).toBe("usage: infra observability-sync <worker>... [--scope prod|dev] [--apply]\n".repeat(2));
});

it("infra observability-sync prints the guard line under vitest and exits 1", async () => {
  const stderr = captureStderr();

  expect(await main(["web-api"])).toBe(1);
  expect(stderr.lines()).toContain(
    "infra observability-sync: refusing the account's cloud credentials under a test runner",
  );
});
