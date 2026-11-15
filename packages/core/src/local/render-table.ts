import { NO_INDEX } from "../shared/no-index.constants.ts";
import { LOOPBACK } from "./local.constants.ts";
import type { StackProcess } from "./stack-options.ts";

/** What the table shows: the origin, why its port was skipped, the route hosts, the processes and the dirs. */
type TableInput = {
  hosts: readonly string[];
  origin: string;
  processes: readonly StackProcess[];
  registry: string;
  skipped: string | undefined;
  state: string;
};

function processRows(processes: readonly StackProcess[]): string[] {
  const rows = processes.map((each) => [
    each.child.name,
    each.url,
    `${LOOPBACK}:${each.inspector}`,
    each.serves.join(" "),
  ]);

  const widths = (rows[0] ?? [])
    .slice(0, NO_INDEX)
    .map((_, at) => Math.max(...rows.map((row) => row[at]?.length ?? 0)));

  return rows.map(
    (row) =>
      `  ${row
        .map((cell, at) => cell.padEnd(widths[at] ?? 0))
        .join("  ")
        .trimEnd()}`,
  );
}

/** The table `infra loc` prints once the stack answers. */
export function renderTable(input: TableInput): string {
  const skipped =
    input.skipped === undefined
      ? []
      : [
          `  ${input.skipped}, so the origin has a port; a redirect URL registered outside this repo holds only on ` +
            "the portless origin",
        ];

  return [
    `local stack at ${input.origin}`,
    ...skipped,
    ...input.hosts.map((host) => `  ${host}`),
    ...processRows(input.processes),
    `  state ${input.state}`,
    `  registry ${input.registry}`,
  ].join("\n");
}
