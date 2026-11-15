import { LINE_BREAK } from "./probe-patterns.constants.ts";

/** The first line of `output` that starts an HTTP status, or `null`. */
export function firstHttpStatusLine(output: string): string | null {
  return output.split(LINE_BREAK).find((line) => line.startsWith("HTTP/")) ?? null;
}
