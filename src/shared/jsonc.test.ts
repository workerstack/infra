import { describe, expect, it } from "vitest";

import { parseJsonc, stringifyJson, stripJsonc } from "./jsonc.ts";

describe("stripJsonc comments", () => {
  it("leaves plain JSON untouched", () => {
    const source = '{\n\t"name": "acme"\n}';

    expect(stripJsonc(source)).toBe(source);
  });

  it("removes line comments", () => {
    expect(parseJsonc('{\n\t// the worker name\n\t"name": "acme"\n}')).toStrictEqual({ name: "acme" });
  });

  it("removes a trailing line comment after a value", () => {
    expect(parseJsonc('{ "name": "acme" // keep in sync\n}')).toStrictEqual({ name: "acme" });
  });

  it("removes block comments, including multi-line ones", () => {
    expect(parseJsonc('{\n\t/* set by\n\t   infra gen */\n\t"name": "acme"\n}')).toStrictEqual({ name: "acme" });
  });

  it("drops an unterminated block comment instead of hanging on it", () => {
    expect(stripJsonc('{ "name": "acme" } /* unterminated')).toBe('{ "name": "acme" } ');
  });
});

describe("stripJsonc commas", () => {
  it("removes trailing commas in objects and arrays", () => {
    expect(parseJsonc('{ "routes": [1, 2,], "name": "acme", }')).toStrictEqual({ name: "acme", routes: [1, 2] });
  });

  it("removes a trailing comma separated from its brace by whitespace", () => {
    expect(parseJsonc('{\n\t"name": "acme",\n\n}')).toStrictEqual({ name: "acme" });
  });

  it("keeps a comma inside a string", () => {
    expect(parseJsonc('{ "note": "a, }" }')).toStrictEqual({ note: "a, }" });
  });
});

describe("stripJsonc strings", () => {
  it("keeps comment markers that live inside strings", () => {
    expect(parseJsonc('{ "url": "https://acme.io/app" }')).toStrictEqual({ url: "https://acme.io/app" });
    expect(parseJsonc('{ "note": "/* not a comment */" }')).toStrictEqual({ note: "/* not a comment */" });
    expect(parseJsonc('{ "note": "a // b" }')).toStrictEqual({ note: "a // b" });
  });

  it("respects escaped quotes when tracking string boundaries", () => {
    expect(parseJsonc('{ "note": "say \\"hi\\" // now" }')).toStrictEqual({ note: 'say "hi" // now' });
  });

  it("survives a trailing backslash at the very end of the input", () => {
    expect(stripJsonc('{ "note": "x\\')).toBe('{ "note": "x\\');
  });
});

describe("parseJsonc", () => {
  it("parses a wrangler-shaped config with comments and trailing commas", () => {
    const source = `{
      // generated: edit the env, not this file
      "name": "acme-api",
      "vars": {
        "WEB_APP_URL": "https://acme.io/app", /* dev */
      },
    }`;

    expect(parseJsonc(source)).toStrictEqual({ name: "acme-api", vars: { WEB_APP_URL: "https://acme.io/app" } });
  });

  it("throws on genuinely malformed input rather than guessing", () => {
    expect(() => parseJsonc('{ "name": }')).toThrow(SyntaxError);
  });
});

describe("stringifyJson", () => {
  it("writes tab-indented JSON ending in a newline", () => {
    expect(stringifyJson({ name: "acme" })).toBe('{\n\t"name": "acme"\n}\n');
  });

  it("round-trips a parsed JSONC document", () => {
    const parsed = parseJsonc('{\n\t// note\n\t"name": "acme",\n}');

    expect(parseJsonc(stringifyJson(parsed))).toStrictEqual(parsed);
  });
});
