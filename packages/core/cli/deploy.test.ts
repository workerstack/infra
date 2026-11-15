import { afterEach, expect, test, vi } from "vitest";

import { captureStderr } from "./__fixtures__/capture-stderr.ts";
import { main } from "./deploy.ts";

const USAGE = "usage: infra deploy [worker...] --scope dev|prod [--prune]\n";

afterEach(() => {
  vi.restoreAllMocks();
});

test.each([[[]], [["web"]], [["--scope", "local"]], [["--env", "prod"]], [["--scope", "prod", "--force"]]])(
  "infra deploy %j prints usage and exits 2",
  async (args: string[]) => {
    const stderr = captureStderr();

    expect(await main(args)).toBe(2);
    expect(stderr.lines()).toBe(USAGE);
  },
);

test("infra deploy prints the guard line under vitest and exits 1", async () => {
  const stderr = captureStderr();

  expect(await main(["web", "--scope", "prod"])).toBe(1);
  expect(stderr.lines()).toContain("infra deploy: refusing the account's cloud credentials under a test runner");
});
