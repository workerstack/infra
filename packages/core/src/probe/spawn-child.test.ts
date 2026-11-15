import { expect, it } from "vitest";

import { spawnChild } from "./spawn-child.ts";

it("collects stdout, stderr and the exit code of a child", async () => {
  const script = 'process.stdout.write("out"); process.stderr.write("err"); process.exit(3)';

  expect(await spawnChild([process.execPath, "-e", script])).toStrictEqual({
    exitCode: 3,
    stderr: "err",
    stdout: "out",
  });
});
