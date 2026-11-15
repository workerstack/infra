import type { ProbeIo } from "../probe-io.ts";

export type FakeProbeIo = { errors: string[]; io: ProbeIo; lines: string[] };

/** An io that records what it printed; `question` fails the test unless `overrides` answers it. */
export function fakeProbeIo(overrides: Partial<ProbeIo> = {}): FakeProbeIo {
  const errors: string[] = [];
  const lines: string[] = [];

  const io: ProbeIo = {
    error: (line) => errors.push(line),
    isTTY: false,
    log: (line) => lines.push(line),
    question: () => Promise.reject(new Error("question should not run")),
    ...overrides,
  };

  return { errors, io, lines };
}
