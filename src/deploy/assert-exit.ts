/** Throws `<label> exited <code>` for a program that did not exit 0; its own output is already on the terminal. */
export function assertExit(label: string, code: number): void {
  if (code !== 0) throw new Error(`${label} exited ${code}`);
}
