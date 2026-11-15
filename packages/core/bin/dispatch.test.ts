import { describe, expect, test } from "vitest";

import { dispatch } from "./dispatch.ts";

const cliDir = `${import.meta.dirname}/__fixtures__/cli`;

async function capture(args: readonly string[]): Promise<{ code: number; lines: string[] }> {
  const lines: string[] = [];
  const code = await dispatch(args, cliDir, (line) => lines.push(line));

  return { code, lines };
}

describe("dispatch", () => {
  test("no args prints usage and the command list, returns 2", async () => {
    expect(await capture([])).toStrictEqual({
      code: 2,
      lines: ["usage: infra <command> [args]", "commands: echo"],
    });
  });

  test("unknown command is named with the command list, returns 2", async () => {
    expect(await capture(["nope"])).toStrictEqual({
      code: 2,
      lines: ['infra: unknown command "nope"; commands: echo'],
    });
  });

  test.each(["../x", "a/b", "Echo", "-x"])("refuses the non-word name %s", async (name) => {
    expect(await capture([name])).toStrictEqual({
      code: 2,
      lines: [`infra: unknown command "${name}"; commands: echo`],
    });
  });

  test("a known command gets the remaining args and its code is returned", async () => {
    expect(await capture(["echo", "a", "b"])).toStrictEqual({ code: 5, lines: [] });
  });
});
