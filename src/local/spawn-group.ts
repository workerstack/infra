import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

import type { ChildEnv } from "../child-env.ts";
import type { Child, ChildExit, LineSink } from "./child.ts";
import { cmdlineOf } from "./cmdline-of.ts";
import { execedCmdline } from "./execed-cmdline.ts";
import { TAIL_LINES } from "./local.constants.ts";
import { printLine } from "./print-line.ts";
import { procStat } from "./proc-stat.ts";

/** One child to start: its argv, where, with what env, its name in output and where its lines go. */
type GroupSpec = { cmd: readonly string[]; cwd: string; env: ChildEnv; name: string; onLine?: LineSink | undefined };

// Each line goes to the sink; the last ones stay for a crash report.
function tailOf(streams: readonly NodeJS.ReadableStream[], name: string, sink: LineSink): () => string[] {
  const tail: string[] = [];

  for (const stream of streams) {
    createInterface({ input: stream }).on("line", (line: string) => {
      tail.push(line);

      if (tail.length > TAIL_LINES) tail.shift();

      sink(name, line);
    });
  }

  return () => [...tail];
}

/** Starts a child leading its own process group, its output piped line by line to `onLine` (stdout by default). */
export async function spawnGroup(spec: GroupSpec): Promise<Child> {
  const [command, ...args] = spec.cmd;

  if (command === undefined) throw new Error(`${spec.name}: empty command`);

  const child = spawn(command, args, {
    cwd: spec.cwd,
    detached: true,
    env: spec.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const { pid } = child;

  if (pid === undefined) throw new Error(`${spec.name}: ${command} did not start`);

  const lastLines = tailOf([child.stdout, child.stderr], spec.name, spec.onLine ?? printLine);
  // Both streams drain before `close`, so the tail holds the last lines when a caller reads it.

  const exited = new Promise<ChildExit>((resolve) => {
    child.once("close", (code, signal) => {
      resolve({ code, signal });
    });
  });

  const cmdline = await execedCmdline(() => cmdlineOf(pid), cmdlineOf(process.pid), pid);

  return { cmdline, exited, lastLines, name: spec.name, pgid: pid, pid, start: procStat(pid)?.start ?? 0 };
}
