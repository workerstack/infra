import type { TailChild } from "../tail-child.ts";
import type { TailLaunch } from "../tail-launch.ts";
import type { TailSpawn } from "../tail-spawn.ts";

export type FakeTail = {
  killed: string[];
  launches: TailLaunch[];
  spawn: TailSpawn;
};

export type TailScript = {
  /** The child ends only when killed. */
  hangs?: boolean;
  exit?: number;
  stderr?: string;
  stdout?: string[];
};

async function* chunks(items: string[]): AsyncGenerator<string> {
  await Promise.resolve();
  yield* items;
}

/** A spawn whose children play `scripts[script name]` (the arg after `tail`); each launch is recorded. */
export function fakeTailSpawn(scripts: Record<string, TailScript>): FakeTail {
  const launches: TailLaunch[] = [];
  const killed: string[] = [];

  return {
    killed,
    launches,
    spawn: (launch): TailChild => {
      const script = launch.args[launch.args.indexOf("tail") + 1] ?? "";
      const plan = scripts[script] ?? {};
      let release: (code: number) => void = () => undefined;
      const exited = new Promise<number>((done) => {
        release = done;

        if (plan.hangs !== true) done(plan.exit ?? 0);
      });

      launches.push(launch);

      return {
        exited,
        kill: () => {
          killed.push(script);
          release(0);
        },
        stderr: chunks(plan.stderr === undefined ? [] : [plan.stderr]),
        stdout: chunks(plan.stdout ?? []),
      };
    },
  };
}
