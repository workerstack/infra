import { afterEach, expect, it, vi } from "vitest";

import { captureStderr } from "./__fixtures__/capture-stderr.ts";
import { infraRepo } from "./__fixtures__/infra-repo.ts";
import { main } from "./loc.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

it("infra loc prints usage and exits 2 for --all, a second name or an unknown flag", async () => {
  const stderr = captureStderr();

  expect(await main(["--all"])).toBe(2);
  expect(await main(["a", "b"])).toBe(2);
  expect(await main(["--force"])).toBe(2);
  expect(stderr.lines()).toBe("usage: infra loc [name] [--only dir,...] [--with dir,...]\n".repeat(3));
});

it("infra loc prints the guard line under vitest and exits 1", async () => {
  const stderr = captureStderr();

  expect(await main(["--only", "api"])).toBe(1);
  expect(stderr.lines()).toContain("infra loc: refusing the account's cloud credentials under a test runner");
});

it("infra loc refuses a product with no local block and exits 1", () => {
  const run = infraRepo({}, ["loc"]);

  expect(run.code).toBe(1);
  expect(run.stderr).toMatch(/^infra loc: [^:]+: no local block in its infra config, so it has no local stack\n$/);
});
