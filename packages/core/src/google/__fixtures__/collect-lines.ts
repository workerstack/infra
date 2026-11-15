/** A `Log` and the lines it received. */
export function collectLines(): { lines: string[]; log: (line: string) => void } {
  const lines: string[] = [];

  return { lines, log: (line) => lines.push(line) };
}
