import { afterEach, expect, it, vi } from "vitest";

import { captureStderr } from "./__fixtures__/capture-stderr.ts";
import { main } from "./probe.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

it("infra probe prints usage and exits 2 for an unknown flag or a second host", async () => {
  const stderr = captureStderr();

  expect(await main(["--port=1"])).toBe(2);
  expect(await main(["a.example", "b.example"])).toBe(2);
  expect(stderr.lines()).toBe("usage: infra probe [host]\nusage: infra probe [host]\n");
});

it("infra probe exits 1 and says why for a host that is not valid", async () => {
  const stderr = captureStderr();

  expect(await main(["not a host"])).toBe(1);
  expect(stderr.lines()).toBe("Invalid host not a host\n");
});
