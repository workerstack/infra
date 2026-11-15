import { afterEach, expect, it, vi } from "vitest";

import { captureStderr } from "./__fixtures__/capture-stderr.ts";
import { main } from "./logs-tail.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

it("infra logs-tail prints the usage and exits 2 with no Worker", async () => {
  const stderr = captureStderr();

  expect(await main([])).toBe(2);
  expect(stderr.lines()).toContain("usage: infra logs-tail <worker>... [--scope prod|dev] [--minutes 15]");
});

it("infra logs-tail prints the guard line under vitest and exits 1", async () => {
  const stderr = captureStderr();

  expect(await main(["web-api"])).toBe(1);
  expect(stderr.lines()).toContain("infra logs-tail: refusing the account's cloud credentials under a test runner");
});
