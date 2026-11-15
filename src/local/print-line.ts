import { stdoutLog } from "../shared/stdout-log.ts";

/** The default `LineSink`: each child line on stdout, after the child's name. */
export function printLine(name: string, line: string): void {
  stdoutLog(`${name} │ ${line}`);
}
