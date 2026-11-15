import { afterEach, describe, expect, it, vi } from "vitest";

import { stdoutLog } from "./stdout-log.ts";

describe("stdoutLog", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes the line and a newline to stdout", () => {
    const write = vi.spyOn(process.stdout, "write").mockReturnValue(true);

    stdoutLog("hello");

    expect(write).toHaveBeenCalledWith("hello\n");
  });
});
