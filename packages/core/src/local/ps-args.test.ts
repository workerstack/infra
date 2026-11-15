import { describe, expect, it } from "vitest";

import { processOf } from "./process-of.ts";
import { readProcessTable } from "./read-process-table.ts";

function argsOf(read: (run: (command: string, args: readonly string[]) => string) => void): readonly string[] {
  let seen: readonly string[] = [];

  read((_command, args) => {
    seen = args;

    return "";
  });

  return seen;
}

describe("ps on darwin", () => {
  it("asks for unlimited width when it lists every process, so long command lines match their lock", () => {
    expect(argsOf((run) => void readProcessTable("darwin", run))).toContain("-ww");
  });

  it("asks for unlimited width when it reads one process", () => {
    expect(argsOf((run) => void processOf(1, "darwin", run))).toContain("-ww");
  });
});
