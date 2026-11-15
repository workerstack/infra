/** How a child ended: its exit code, or the signal that ended it. */
export type ChildExit = { code: number | null; signal: NodeJS.Signals | null };

/**
 * A child the launcher started, leading its own process group so a stop reaches everything it started (workerd
 * under wrangler, esbuild under Vite).
 */
export type Child = {
  /** Its /proc cmdline at start, NUL-separated: with `start`, what tells it from a later process reusing its pid. */
  cmdline: string;
  exited: Promise<ChildExit>;
  lastLines: () => string[];
  name: string;
  pgid: number;
  pid: number;
  /** Its start time in clock ticks since boot (/proc/<pid>/stat field 22). */
  start: number;
};

/** Where a child's output lines go, each with the child's name. */
export type LineSink = (name: string, line: string) => void;
