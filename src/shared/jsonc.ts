import { ESCAPE_SEQUENCE_CHARS } from "./escape-sequence-chars.constants.ts";
import type { Json } from "./json.ts";
import { NO_INDEX } from "./no-index.constants.ts";
import { WHITESPACE } from "./whitespace.constants.ts";

// Returns the index to resume at when it drops text at `index`, or undefined to keep the character.
type Drop = (src: string, index: number) => number | undefined;

// The index after the string that opens at `start`; an unterminated string runs to the end.
function stringEnd(src: string, start: number): number {
  const quote = src[start];
  let index = start + 1;

  while (index < src.length) {
    if (src[index] === "\\" && index + 1 < src.length) index += ESCAPE_SEQUENCE_CHARS;
    else if (src[index] === quote) return index + 1;
    else index++;
  }

  return index;
}

// Copies strings whole and lets `drop` remove text outside them, so string contents are never touched.
function dropOutsideStrings(src: string, drop: Drop): string {
  let out = "";
  let index = 0;

  while (index < src.length) {
    const char = src[index];

    if (char === '"' || char === "'") {
      const end = stringEnd(src, index);
      out += src.slice(index, end);
      index = end;
      continue;
    }

    const next = drop(src, index);

    if (next === undefined) {
      out += char;
      index++;
    } else {
      index = next;
    }
  }

  return out;
}

function dropComment(src: string, index: number): number | undefined {
  if (src.startsWith("//", index)) {
    const newline = src.indexOf("\n", index);

    return newline === NO_INDEX ? src.length : newline;
  }

  if (src.startsWith("/*", index)) {
    const close = src.indexOf("*/", index + "/*".length);

    return close === NO_INDEX ? src.length : close + "*/".length;
  }

  return undefined;
}

// A comma that closes an object or array; a regex over the whole text would also eat one inside a string.
function dropTrailingComma(src: string, index: number): number | undefined {
  if (src[index] !== ",") return undefined;

  let lookahead = index + 1;

  while (lookahead < src.length && WHITESPACE.test(src[lookahead] ?? "")) lookahead++;

  const closer = src[lookahead];

  return closer === "}" || closer === "]" ? index + 1 : undefined;
}

/** JSONC text as plain JSON: comments and trailing commas removed. */
export function stripJsonc(src: string): string {
  return dropOutsideStrings(dropOutsideStrings(src, dropComment), dropTrailingComma);
}

/** Parses JSONC (comments and trailing commas); malformed JSON throws. */
export function parseJsonc(src: string): Json {
  return JSON.parse(stripJsonc(src)) /* JSON.parse yields only JSON values */ as Json;
}

/** Canonical JSON: tab-indented, ending in a newline. */
export function stringifyJson(value: Json): string {
  return `${JSON.stringify(value, null, "\t")}\n`;
}
