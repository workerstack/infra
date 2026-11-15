import { describe, expect, it } from "vitest";

import { assertNotUnderTest } from "./assert-not-under-test.ts";

const LINE =
  "refusing the account's cloud credentials under a test runner (VITEST or NODE_ENV=test); a test uses a fake instead";

describe("assertNotUnderTest", () => {
  it("throws when VITEST is set", () => {
    expect(() => assertNotUnderTest({ VITEST: "true" })).toThrow(LINE);
  });

  it("throws when NODE_ENV is test", () => {
    expect(() => assertNotUnderTest({ NODE_ENV: "test" })).toThrow(LINE);
  });

  it("passes for an empty VITEST and another NODE_ENV", () => {
    expect(() => assertNotUnderTest({ NODE_ENV: "production", VITEST: "" })).not.toThrow();
  });

  it("passes for an empty base", () => {
    expect(() => assertNotUnderTest({})).not.toThrow();
  });
});
