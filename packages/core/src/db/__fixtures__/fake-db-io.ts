import type { ChildEnv } from "../../child-env.ts";
import type { ChildOptions } from "../../deploy/child-options.ts";
import type { DbIo, DbRun, DbTool } from "../db-io.ts";

/** One program a database command ran. */
export type DbCall = { args: string[]; cwd: string; env: ChildEnv; tool: DbTool };

export type FakeDbOptions = {
  /** What a program prints and exits with; a throw stands for a program that could not start. */
  onSpawn?: (call: DbCall) => DbRun | Promise<DbRun>;
};

export type FakeDb = {
  calls: DbCall[];
  /** `env` for each read of the child env and `spawn:<tool>` for each program, in order. */
  events: string[];
  io: DbIo;
  out: string[];
};

const FAKE_ENV: ChildEnv = { CLOUDFLARE_API_TOKEN: "token" };
const OK: DbRun = { code: 0, stderr: "", stdout: "" };

/** A `DbIo` that runs nothing and records what it was asked to run and print. */
export function fakeDbIo(options: FakeDbOptions = {}): FakeDb {
  const calls: DbCall[] = [];
  const events: string[] = [];
  const out: string[] = [];

  const io: DbIo = {
    env: () => {
      events.push("env");

      return FAKE_ENV;
    },
    print: (line) => out.push(line),
    spawn: async (tool: DbTool, args: string[], child: ChildOptions) => {
      const call = { args, cwd: child.cwd, env: child.env, tool };

      events.push(`spawn:${tool}`);
      calls.push(call);

      return (await options.onSpawn?.(call)) ?? OK;
    },
  };

  return { calls, events, io, out };
}
