import type { QueryWindow } from "./query-window.ts";

function check(from: number | undefined, to: number | undefined): string | undefined {
  if (Number.isNaN(from) || Number.isNaN(to)) return "--from / --to must be ISO timestamps.";

  if (to !== undefined && from === undefined) return "--to needs --from.";

  return from !== undefined && to !== undefined && from >= to ? "--from must be before --to." : undefined;
}

/** Reads `--from` and `--to` as ISO timestamps; `--to` needs `--from`, which must come first. */
export function parseQueryWindow(from: string | undefined, to: string | undefined): QueryWindow {
  const start = from === undefined ? undefined : Date.parse(from);
  const end = to === undefined ? undefined : Date.parse(to);
  const error = check(start, end);

  if (error !== undefined) return { error, ok: false };

  return { ok: true, ...(start !== undefined && { from: start }), ...(end !== undefined && { to: end }) };
}
