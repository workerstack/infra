import { expect, it } from "vitest";

import { parseTarget } from "./parse-target.ts";

it("parseTarget reads no args, a name and --all", () => {
  expect(parseTarget([])).toStrictEqual({ target: undefined });
  expect(parseTarget(["apps/web"])).toStrictEqual({ target: { name: "apps/web" } });
  expect(parseTarget(["--all"])).toStrictEqual({ target: { all: true } });
});

it("parseTarget rejects extra args and unknown flags", () => {
  expect(parseTarget(["a", "b"])).toBeUndefined();
  expect(parseTarget(["--force"])).toBeUndefined();
  expect(parseTarget(["-a"])).toBeUndefined();
});
