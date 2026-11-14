import { describe, expect, it } from "vitest";

import { scopedEntries } from "./scoped-entries.ts";

describe("scopedEntries", () => {
  it("lists the scopes present in scope order", () => {
    expect(scopedEntries({ local: 0, prod: 2 })).toStrictEqual([
      ["local", 0],
      ["prod", 2],
    ]);
  });

  it("is empty for nothing", () => {
    expect(scopedEntries(undefined)).toStrictEqual([]);
  });
});
