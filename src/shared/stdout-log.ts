/** The default `Log`: a line on stdout. */
export function stdoutLog(line: string): void {
  process.stdout.write(`${line}\n`);
}
