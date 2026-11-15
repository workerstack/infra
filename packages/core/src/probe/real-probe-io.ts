import * as readline from "node:readline/promises";

import type { ProbeIo } from "./probe-io.ts";

async function ask(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    return await rl.question(prompt);
  } finally {
    rl.close();
  }
}

/** The terminal: lines on stdout and stderr, and a prompt on stdin when it is a terminal. */
export function realProbeIo(): ProbeIo {
  return {
    error: (line) => process.stderr.write(`${line}\n`),
    isTTY: process.stdin.isTTY,
    log: (line) => process.stdout.write(`${line}\n`),
    question: ask,
  };
}
