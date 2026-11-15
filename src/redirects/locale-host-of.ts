/** The host a route pattern names: everything before its first slash. */
export function localeHostOf(pattern: string): string {
  return pattern.split("/")[0] ?? "";
}
