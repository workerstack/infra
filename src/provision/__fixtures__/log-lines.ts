import type { Log } from "../../shared/log.ts";

/** A `Log` that keeps every line it is given. */
export function logLines(): { lines: string[]; log: Log } {
  const lines: string[] = [];

  return {
    lines,
    log: (line) => {
      lines.push(line);
    },
  };
}
