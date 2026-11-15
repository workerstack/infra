import type { ChildEnv } from "../../child-env.ts";
import type { DeployIo } from "../deploy-io.ts";
import type { DeployTool } from "../deploy-tool.ts";

/** One program a deploy ran. */
export type FakeCall = { args: string[]; cwd: string; env: ChildEnv; tool: DeployTool };

export type FakeOptions = {
  /** The exit code of a program run through `spawn`; a throw stands for a program that could not start. */
  onSpawn?: (call: FakeCall) => Promise<number> | number;
  /** The names `wrangler secret list` prints. */
  listed?: string[];
  redirects?: string[];
  scripts?: Record<string, string>;
  secrets?: Record<string, string>;
};

export type FakeDeploy = { calls: FakeCall[]; err: string[]; io: DeployIo; linked: string[]; out: string[] };

const FAKE_ENV: ChildEnv = { CLOUDFLARE_API_TOKEN: "token" };

/** A `DeployIo` that runs nothing and records what it was asked to run and print. */
export function fakeDeployIo(options: FakeOptions = {}): FakeDeploy {
  const calls: FakeCall[] = [];
  const err: string[] = [];
  const linked: string[] = [];
  const out: string[] = [];
  const names = (options.listed ?? []).map((name) => ({ name }));

  const io: DeployIo = {
    env: () => FAKE_ENV,
    error: (line) => err.push(line),
    linkDevServer: (dir) => linked.push(dir),
    packageScripts: () => options.scripts ?? {},
    print: (line) => out.push(line),
    run: (tool, args, child) => {
      calls.push({ args, cwd: child.cwd, env: child.env, tool });

      return Promise.resolve({ code: 0, stdout: JSON.stringify(names) });
    },
    secrets: () => Promise.resolve(options.secrets ?? {}),
    setRedirects: () => Promise.resolve(options.redirects ?? []),
    spawn: async (tool, args, child) => {
      const call = { args, cwd: child.cwd, env: child.env, tool };

      calls.push(call);

      return (await options.onSpawn?.(call)) ?? 0;
    },
  };

  return { calls, err, io, linked, out };
}
