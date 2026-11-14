import { vi } from "vitest";

export type StderrCapture = { lines: () => string };

/** Silences `process.stderr.write` and returns what was written; undo it with `vi.restoreAllMocks`. */
export function captureStderr(): StderrCapture {
  const write = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

  return { lines: () => write.mock.calls.map(([chunk]) => String(chunk)).join("") };
}
