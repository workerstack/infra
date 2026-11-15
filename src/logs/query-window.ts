/** The `--from` and `--to` times in ms, or the line saying what is wrong with them. */
export type QueryWindow = { from?: number; ok: true; to?: number } | { error: string; ok: false };
