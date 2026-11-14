import { describe, expect, it } from "vitest";

import { applyEdits } from "./apply-edits.ts";
import { escapePattern } from "./escape-pattern.ts";

describe("applyEdits", () => {
  it("applies a string and a regex edit in order", () => {
    const content = 'KV: { id: "STUB" }, database_id: "STUB",  database_name: "example.db"';

    const edits = [
      { pattern: 'KV: { id: "STUB" }', replacement: 'KV: { id: "kv1" }' },
      {
        pattern: new RegExp(`database_id: "STUB",(\\s+)database_name: "${escapePattern("example.db")}"`),
        replacement: 'database_id: "d1",$1database_name: "example.db"',
      },
    ];

    expect(applyEdits(content, edits)).toBe('KV: { id: "kv1" }, database_id: "d1",  database_name: "example.db"');
  });

  it("returns the content as it was for no edits", () => {
    expect(applyEdits("a", [])).toBe("a");
  });
});

describe("escapePattern", () => {
  it("escapes regex characters so a name matches literally", () => {
    expect(new RegExp(escapePattern("a.b(c)")).test("a.b(c)")).toBe(true);
    expect(new RegExp(escapePattern("a.b")).test("axb")).toBe(false);
  });
});
