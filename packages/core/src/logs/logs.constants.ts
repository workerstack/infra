/** Milliseconds in a minute. */
export const MS_PER_MINUTE = 60_000;

/** The end of `HH:MM:SS.mmm` in an ISO timestamp. */
export const ISO_MILLIS_END = 23;

/** The start of `HH:MM:SS.mmm` in an ISO timestamp. */
export const ISO_TIME_START = 11;

/** The start of `MM-DDTHH:MM:SS.mmm` in an ISO timestamp. */
export const ISO_MONTH_START = 5;

/** The longest message a summary line shows before it is cut. */
export const MESSAGE_MAX = 300;

/** The pino level that reads as an error. */
export const PINO_ERROR = 50;

/** The pino level that reads as a warning. */
export const PINO_WARN = 40;

/** The `level` field of a pino-shaped JSON log line. */
export const PINO_LEVEL: RegExp = /"level":(\d+)/;

/** The level name of an error. */
export const LEVEL_ERROR = "error";

/** The level name of a warning. */
export const LEVEL_WARN = "warn";

/** The level name of a fatal error. */
export const LEVEL_FATAL = "fatal";

/** The level wrangler gives a `console.log` line. */
export const LEVEL_LOG = "log";

/** Pino's numeric levels and their names. */
export const PINO_LEVEL_NAMES = [
  [10, "trace"],
  [20, "debug"],
  [30, "info"],
  [40, "warn"],
  [50, "error"],
  [60, "fatal"],
] as const;
