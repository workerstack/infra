import { PS_LINE } from "./local.constants.ts";
import type { ProcessRow } from "./process-row.ts";
import { WHITESPACE_RUN } from "./whitespace-run.constants.ts";

/** The rows of `ps -axo pid=,ppid=,pgid=,lstart=,command=`; a line that is not a process row is skipped. */
export function parsePs(text: string): ProcessRow[] {
  return text.split("\n").flatMap((line) => {
    const found = PS_LINE.exec(line)?.groups;

    if (found === undefined) return [];

    const start = Date.parse((found["lstart"] ?? "").split(WHITESPACE_RUN).join(" "));

    return [
      {
        cmdline: found["cmdline"] ?? "",
        group: Number(found["group"]),
        parent: Number(found["parent"]),
        pid: Number(found["pid"]),
        start: Number.isNaN(start) ? 0 : start,
      },
    ];
  });
}
