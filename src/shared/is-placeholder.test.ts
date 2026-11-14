import { describe, expect, it } from "vitest";

import { isPlaceholder } from "./is-placeholder.ts";
import { STUB } from "./stub.constants.ts";

describe("isPlaceholder", () => {
  it.each([STUB, "", undefined])("is true for %j", (value) => {
    expect(isPlaceholder(value)).toBe(true);
  });

  it.each(["abc123", "stub", " "])("is false for %j", (value) => {
    expect(isPlaceholder(value)).toBe(false);
  });
});
