import { UNSAFE_IN_FILE_NAME } from "./unsafe-in-file-name.constants.ts";

/** A file-name-safe UTC timestamp: `2026-11-15T10-00-00-000Z`. */
export function stamp(date: Date = new Date()): string {
  return date.toISOString().replaceAll(UNSAFE_IN_FILE_NAME, "-");
}
