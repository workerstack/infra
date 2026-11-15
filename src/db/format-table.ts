/** One result row: its cells, and a note printed under it. */
export type TableRow = { cells: string[]; note?: string | undefined };

function widthsOf(header: readonly string[], rows: readonly TableRow[]): number[] {
  return header.map((title, index) => Math.max(title.length, ...rows.map((row) => row.cells[index]?.length ?? 0)));
}

function lineOf(cells: readonly string[], widths: readonly number[]): string {
  return `  ${cells.map((cell, index) => cell.padEnd(widths[index] ?? 0)).join("  ")}`.trimEnd();
}

/** The product heading, the aligned header and the rows, a note under its row as `↳ note`. */
export function formatTable(heading: string, header: readonly string[], rows: readonly TableRow[]): string {
  const widths = widthsOf(header, rows);

  const body = rows.flatMap((row) => [
    lineOf(row.cells, widths),
    ...(row.note === undefined ? [] : [`    ↳ ${row.note}`]),
  ]);

  return [heading, lineOf(header, widths), ...body].join("\n");
}
