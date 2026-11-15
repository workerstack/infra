import { readFileSync } from "node:fs";
import { join } from "node:path";

import * as z from "zod";

import { ERRNO_NOT_PERMITTED } from "./errno-not-permitted.constants.ts";
import { LOCAL_STACK_FILE } from "./local-stack-file.constants.ts";

type LocalStack = {
  /** The edge's bound origin: `http://example.localhost`, or with the port it fell back to. */
  origin: string;
  /** The launcher's pid, so a file a crash left behind reads as no stack. */
  pid: number;
  startedAt: string;
};

// What the state file under a product root says: no file, a stack whose launcher has exited, or a
// running stack. A file that is not a stack throws naming it, since nothing that crashed writes one.
type StackFileState =
  | { file: string; kind: "missing" }
  | { file: string; kind: "exited"; pid: number }
  | { file: string; kind: "running"; stack: LocalStack };

type Alive = (pid: number) => boolean;

function localStackSchema(): z.ZodType<LocalStack> {
  return z.object({
    origin: z.url(),
    pid: z.int().positive(),
    startedAt: z.iso.datetime(),
  });
}

/** The path of the state file under a product root. */
export function localStackPath(productRoot: string): string {
  return join(productRoot, LOCAL_STACK_FILE);
}

// Signal 0 checks the pid without touching it; EPERM is a live process someone else owns.
function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);

    return true;
  } catch (error) {
    return error instanceof Error && "code" in error && error.code === ERRNO_NOT_PERMITTED;
  }
}

function startHint(productRoot: string): string {
  return `start it with \`bun run local\` in ${productRoot}`;
}

function readText(file: string): string | undefined {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return undefined;
  }
}

function parseStack(file: string, text: string, start: string): LocalStack {
  let json: unknown;

  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${file} is not JSON: ${start}`);
  }

  const parsed = localStackSchema().safeParse(json);

  if (!parsed.success) throw new Error(`${file} is not a stack (${z.prettifyError(parsed.error)}): ${start}`);

  return parsed.data;
}

function stackFileState(productRoot: string, alive: Alive): StackFileState {
  const file = localStackPath(productRoot);
  const text = readText(file);

  if (text === undefined) return { file, kind: "missing" };

  const stack = parseStack(file, text, startHint(productRoot));

  return alive(stack.pid) ? { file, kind: "running", stack } : { file, kind: "exited", pid: stack.pid };
}

/**
 * The stack running under a product root, or an error naming the file and the command that starts
 * one: no file, a file that is not a stack, or one whose launcher has exited.
 */
export function readLocalStack(productRoot: string, alive: Alive = pidAlive): LocalStack {
  const state = stackFileState(productRoot, alive);
  const start = startHint(productRoot);

  if (state.kind === "running") return state.stack;

  if (state.kind === "exited")
    throw new Error(`The local stack in ${state.file} has exited (pid ${state.pid}): ${start}`);

  throw new Error(`No local stack is running (${state.file} is missing): ${start}`);
}

/**
 * The stack running under a product root, or `undefined` when none runs (no file, or its launcher
 * has exited); a file that is not a stack still throws naming it.
 */
export function findLocalStack(productRoot: string, alive: Alive = pidAlive): LocalStack | undefined {
  const state = stackFileState(productRoot, alive);

  return state.kind === "running" ? state.stack : undefined;
}
