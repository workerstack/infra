import { expect, it } from "vitest";

import { parseApplyOutput } from "./parse-apply-output.ts";

it("is a noop when database applied nothing, and applied with the count of files it applied", () => {
  expect(parseApplyOutput('{"applied":[],"refused":[]}', "", 0)).toStrictEqual({
    migrationsApplied: 0,
    status: "noop",
  });
  expect(parseApplyOutput('log\n{"applied":["a.sql","b.sql"],"refused":[]}\n', "", 0)).toStrictEqual({
    migrationsApplied: 2,
    status: "applied",
  });
});

it("fails with what database refused, else its stderr", () => {
  expect(parseApplyOutput('{"applied":[],"refused":["a.sql: unsafe"]}', "ignored", 1)).toStrictEqual({
    error: "a.sql: unsafe",
    migrationsApplied: 0,
    status: "failed",
  });
  expect(parseApplyOutput("", " boom \n", 1).error).toBe("boom");
  expect(parseApplyOutput("", "", 1).error).toBe("unknown failure");
});

it("fails when database printed no result it can read, even on exit 0", () => {
  expect(parseApplyOutput("", "", 0).error).toBe("database printed no --json result");
  expect(parseApplyOutput('{"applied":"x"}', "", 0).status).toBe("failed");
});
