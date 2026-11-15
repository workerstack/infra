import { expect, test, vi } from "vitest";

import pkg from "../package.json" with { type: "json" };
import { main } from "./version.ts";

test("prints package.json's version and returns 0", async () => {
  const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

  try {
    const code = await main([]);

    expect(code).toBe(0);
    expect(write.mock.calls).toStrictEqual([[`${pkg.version}\n`]]);
  } finally {
    write.mockRestore();
  }
});
