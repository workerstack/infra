import { expect, it } from "vitest";

import { parseProbeArgs } from "./parse-probe-args.ts";

it("asks for a host when none is given", () => {
  expect(parseProbeArgs([])).toStrictEqual({ kind: "ask" });
});

it("drops a stray -- before the host", () => {
  expect(parseProbeArgs(["--", "api.example.com"])).toStrictEqual({ kind: "host", raw: "api.example.com" });
});

it("prints help for --help and -h", () => {
  expect(parseProbeArgs(["--help"])).toStrictEqual({ kind: "help" });
  expect(parseProbeArgs(["-h"])).toStrictEqual({ kind: "help" });
});

it("rejects an unknown flag and a second host", () => {
  expect(parseProbeArgs(["--port=8443"])).toStrictEqual({ kind: "usage" });
  expect(parseProbeArgs(["a.example", "b.example"])).toStrictEqual({ kind: "usage" });
});
